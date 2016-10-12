# Follow Me on Fremantle
Notification server for the 2016 FremantleMedia hackathon.
## Inspiration
We wanted to develope a way to make people aware whenever someone that they care about appears in video or on tv. 
## What it does
The application allows users to choose which celebrities or anyone else they would like to follow and allows content creators to send notifications to all intrested users notifying them about when and where to view the content.
## How we built it
We used a WordPress plugin to provide content creators with a way to upload and analyze content using the Wirewax api. Users can provide their contact information and choose which celebrities to follow. They are then notified when ever any content featuring that person is made available. Notifications are sent from a Node server which retreives relevent content from the Getty Images api.
## Challenges we ran into
We were not very experience using WordPress or php, so we used a Node server to perform any complex logic.
## Accomplishments that we're proud of
We created fully functioning application that is live and able to accept users.
## What we learned
We learned how to pull data from the Getty Images and Gracenote apis and integrate an application as a wordpress plugin.
## What's next for Follow Me on Fremantle
Provide complete lists a celebrities appearances and extending the application to make it possible to follow and recognize any person, when they appear on video.
