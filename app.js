
require('dotenv').config()
var fs = require('fs');
var restify = require('restify');
var builder = require('botbuilder');

var calendarAPI = require('./quickstart.js');

// env('/.env');
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/a8f39058-c984-49d8-bbf3-28d60e1bb330?subscription-key=ddd3dbae973542298079d480b41fd69b&verbose=true';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

//=========================================================
// Bots Dialogs
//=========================================================

dialog.matches('None', [
  function (session, args, next) {   
    session.send('I\'m sorry, I didn\'t understand..')
  }
])

dialog.matches('greeting', [
  function (session, args, next) {
    session.send('Welcome to HairGuru! Would you like to make a reservation for a haircut?')
  }
])

dialog.matches('reservation', [
  function (session, args, next) {
    builder.Prompts.text(session, 'Which day would you like to make the reservation for?');

    // Thursday or 2/25 or February 25
      // we chceck calander to see if we have open slot

  }, function (session, results, next) {
    session.userData.day = results.response;
    session.send("We're at second dialogue! You said " + results.response);

    var date = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
    session.send("The day you gave was " + date);
  }
/*
    if (!date) {
        builder.Prompts.text(session, "What would you like to call the task?");
    } else {
        session.end("Great! We're going to make a reservation for " + date)
        next({ response: task.entity });

    }
    */
])

dialog.matches('location', [
  function (session, args, next) {
    session.send('Our address is 201 N Goodwin Ave, Urbana, IL 61801.');
  }
])

dialog.matches('pricing', [
  function (session, args, next) {
    session.send('Haircut is $10. Other treatments\' prices vary.');
  }
])