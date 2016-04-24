/* Find Me on Fremantle */
/* by Brian Cottrell    */
/* 04-23-2016           */

//Add dependencies
var express = require('express'),
    app = express(),
    request = require('request'),
    nodemailer = require('nodemailer'),
    bodyParser = require('body-parser'),
    Twit = require('twit'),
    config;
//Include configuration variables
    if(!process.env.ENVIRONMENT){
        config = require('./config');
    }

//Include static assets
app.use(express.static('public'));

//Parse application/json
app.use(bodyParser.json())

//Use embedded javascript for templating
app.set('view engine', 'ejs');

//Configure email service
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USERNAME || config.gmail.username,
        pass: process.env.GMAIL_PASSWORD || config.gmail.password
    }
});

//Configure twitter api
var twitter = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY || config.twitter.consumer_key,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET || config.twitter.consumer_secret,
    access_token: process.env.TWITTER_ACCESS_TOKEN || config.twitter.access_token,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET || config.twitter.access_token_secret
});

//Add route for root directory
app.get('/', function (req, res) {
    res.send('Hello World!');
});

var celebrity = 'Steve Harvey';

// Send notifications to all interested users
app.post('/notify', function (req, res) {
    var data = req.body,
        title = data.title,
        description = data.description,
        users = data.users,
        authorization;
    //Send email notifications
    request(
        {
            url: 'https://api.gettyimages.com:443/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded'
            },
            form: {
                'client_id': process.env.GETTY_CLIENT_ID || config.getty.client_id,
                'client_secret': process.env.GETTY_CLIENT_SECRET || config.getty.client_secret,
                'grant_type': 'client_credentials'
            }
        },
        function(error, response, body){
            if(error){
                console.log(error);
            }else{
                authorization = body.access_token;
            }
        }
    );
    for(var i = 0; i < users.length; i++){
        if(users[i].email){
            var celebrity = users[i].appearances[0].name;
            var email = users[i].email;
            request(
                {
                    url: 'https://api.gettyimages.com:443/v3/search/images/editorial/?phrase='+encodeURI(celebrity),
                    qs: {
                        'fields': 'comp',
                        'sort_order': 'most_popular'
                    },
                    method: 'GET',
                    headers: {
                        'Authorization': authorization,
                        'Api-Key': process.env.GETTY_CLIENT_ID || config.getty.client_id,
                        'Content-Type' : 'application/json'
                    }
                },
                function(error, response, body){
                    var image;
                    if(error){
                        console.log(error);
                    }else{
                        if(JSON.parse(body).images){
                            image = JSON.parse(body).images[0].display_sizes[0].uri;
                        }else{
                            image = 'http://vignette4.wikia.nocookie.net/logopedia/images/5/5c/FremantleMedia_North_America.png/revision/latest?cb=20141108131130';
                            console.log('Authorization expired');
                        }
                        var mailOptions = {
                            from: celebrity+' is on '+title+'!',
                            to: email,
                            subject: celebrity+' is on '+title+', brought to you by Find Me on Fremantle',
                            text: description,
                            html: '<style>body{background-color: grey;}h1{width:66%; margin:0px; color:#FFF; font-family: Arial; background-color:#337;}p{width:66%; margin:0px; color:#FFF;font-family: Arial;  background-color:#337;}.photo{width:66%; display:block}div{margin-left:23%}</style><a href="http://www.fremantlemedia.com/"><div class="outer"><img src="http://www.tvweek.com/wp-content/uploads/2015/04/fremantlemedia-north-america-logo.png" class="photo"><img src="'+image+'" class="photo" alt="FMoF"><h1>'+title+'</h1><p><b>'+description+'</b><p></div></a>'
                        };
                        transporter.sendMail(mailOptions, function(error, info){
                            if(error){
                                console.log(error);
                            }else{
                                console.log('Message sent: ' + info.response);
                            };
                        });
                    }
                }
            );
        }
    }
    //Send twitter notifications
    var params = {};
    params.status = title+' http://fmot.herokuapp.com/share';
    for(var i = 0; i < users.length; i++){
        if(users[i].twitter){
            params.status = params.status+' '+users[i].twitter;
        }
    }
    twitter.post('statuses/update', params, function (err, data, response) {
        console.log('Twitter post sent');
    });

    res.status(200).send('Hello World!');
});

//Retrieve all of the appearances of a specific celebrity
app.get('/celebrity', function (req, res) {
    request(
        {
            url: 'http://data.tmsapi.com/v1.1/programs/search',
            qs: {
                'q': celebrity.split(' ').join('+'),
                'queryFields': 'cast',
                'api_key': process.env.GRACENOTE_API_KEY || config.gracenote.api_key
            },
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        },
        function (error, response, body) {
            var tmsId = JSON.parse(response.body).hits[0].program.tmsId;
            request(
                {
                    url: 'http://data.tmsapi.com/v1.1/programs/'+tmsId,
                    qs: {
                        'api_key': process.env.GRACENOTE_API_KEY || config.gracenote.api_key
                    },
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                function (error, response, body) {
                    var cast = JSON.parse(response.body).cast;
                    for (var i = 0; i < cast.length; i++) {
                        if (cast[i].name == celebrity) {
                            request(
                                {
                                    url: 'http://data.tmsapi.com/v1.1/celebs/'+cast[i].personId,
                                    qs: {
                                        'api_key': process.env.GRACENOTE_API_KEY || config.gracenote.api_key
                                    },
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                },
                                function (error, response, body) {
                                    console.log(JSON.parse(response.body));
                                }
                            );
                            i = cast.length;
                        }
                    }
                }
            );
        }
    )
    res.status(200).send('Hello World!');
});

//Start Application
app.listen(process.env.PORT || config.port, function () {
    console.log('App listening on port '+(process.env.PORT || config.port)+'!');
});