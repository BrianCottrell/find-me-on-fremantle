/* Find Me on Fremantle */
/* by Brian Cottrell    */
/* 04-23-2016           */

//Add dependencies
var express = require('express'),
    app = express(),
    request = require('request'),
    nodemailer = require('nodemailer'),
    Twit = require('twit'),
//Include configuration variables
    if(process.env.ENVIRONMENT){
        config = require('./config');
    }
    
//Include static assets
app.use(express.static('public'));

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

var notifications = [
    {
        "email": "Brian_Cottrell@inbox.com",
        "phone": "3109386046",
        "twitter": "@Brian__Cottrell",
        "appearances": [
            {
                "id": "434",
                "name": "Steve Harvey",
                "show" : "Family Feud"
            }
        ]
    }
];
var celebrity = 'Steve Harvey';

// Send notifications to all interested users
app.post('/notify', function (req, res) {
    console.log(req);

    var message = 'test1';
    var authorization;
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
    for(var i = 0; i < notifications.length; i++){
        if(notifications[i].email){
            var celebrity = notifications[i].appearances[0].name;
            var email = notifications[i].email;
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
                            from: 'Find Me on TV!',
                            to: email,
                            subject: 'Check out your favorite celebrities in the following program!',
                            text: message,
                            html: '<h1>Find Me on TV!</h1><img src="'+image+'" alt="FMoF"><b>'+message+'✔</b>'
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
    params.status = 'test2'+' http://fmot.herokuapp.com/share';
    for(var i = 0; i < notifications.length; i++){
        if(notifications[i].twitter){
            params.status = params.status+' '+notifications[i].twitter;
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