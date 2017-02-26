
require('dotenv').config()
var fs = require('fs');
var restify = require('restify');
var builder = require('botbuilder');

var calendarAPI = require('./quickstart.js');

var hours = {
  beginTime: 10,
  endTime: 19,
  beginDay: 1,
  endDay: 5
}
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


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
    builder.Prompts.time(session, 'Which day would you like to make the reservation for?');
  }, function (session, results, next) {
    var inputDate = builder.EntityRecognizer.resolveTime([results.response]);
    session.userData.date = inputDate;
    session.send("The date you gave was " + inputDate);
    calendarAPI.listEventsAPI(function(events) {
      var na = {};
      for (e of events) {
        var currDate = new Date(e.start.dateTime);
        if (currDate.getDay() >= hours.beginDay && currDate.getDay() <= hours.endDay &&
            inputDate.getDate() === currDate.getDate() &&
            inputDate.getDay() === currDate.getDay() &&
            inputDate.getFullYear() === currDate.getFullYear()) {
          na[currDate.getHours()] = true;
        }
      }

      var avble = {};
      for (var i = hours.beginTime; i <= hours.endTime; i++) {
        if (na[i] === undefined) {
          avble[i.toString() + "00 hrs"] = i;
        }
      }

      session.userData.avble = avble;
      builder.Prompts.choice(session, "These are the available timeslots on " +  
        days[inputDate.getDay()] + ". What's good for you? (24 hr format)", avble);
    });
  }, function (session, results) {
    var reservedDate = new Date(session.userData.date);
    reservedDate.setHours(session.userData.avble[results.response.entity]);
    calendarAPI.createEventAPI(reservedDate, function() {
      session.send("Congratulations! Your reservation has been made for " + reservedDate);
    });
  }
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