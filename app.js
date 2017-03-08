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

bot.dialog('reset', function (session) {
    // reset data
    session.endConversation("Please comeback again!");
}).triggerAction({ matches: /^exit/i }); 

bot.dialog('bye', function (session) {
    // reset data
    session.endConversation("Please comeback again!");
}).triggerAction({ matches: /^quit/i }); 

dialog.matches('None', [
  function (session, args, next) {   
    session.send('I\'m sorry, I didn\'t understand..')
    session.endDialog();
  }
])

dialog.matches('greeting', [
  function (session) {
    builder.Prompts.choice(
      session,
      'Welcome to HairGuru! Would you like to make a reservation for a haircut?',
      "Yes|No",
      {listStyle:3},
      {
        maxRetries:2,
        retryPrompt: 'That is not a valid option'
      });
  },

  function(session, result){
    if(!result.response){
            session.send('Ooops! Too many attemps 😞 But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
    }

            session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

    var selection = result.response.entity;

    switch(selection){
      case "Yes":
        session.beginDialog('/reservation');

        break;
      case "No":
        session.send('If you have any question, feel free to ask!');
        session.endDialog();
    }

    }
  
  
]);

bot.dialog('/reservation',  [
  function (session, args, next) {
    // begin reservation process
    builder.Prompts.time(session, 'Which day would you like to make the reservation for? (Mon~Sun)');
  }, function (session, results, next) {
    // get user's preferred day, and get available timeslots on that day

    var inputDate = builder.EntityRecognizer.resolveTime([results.response]);
    session.userData.date = inputDate;
    session.send("The date you gave was " + inputDate);

    // make a call to Google Calendar API. The anonymous function passed in is triggered as a callback
    // after the events variable has been populated from Google Calendar.
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
          avble[i.toString() + ":00"] = i;
        }
      }
      session.userData.avble = avble;


      // give the user choice of available timeslot
      builder.Prompts.choice(session, "These are the available timeslots on " +  
        days[inputDate.getDay()] + ". What's good for you? (24 hr format)", avble, {listStyle:3});
    });
  }, function (session, results) {

    // create an event in the Google Calendar for user's chosen timeslot.
    var reservedDate = new Date(session.userData.date);
    reservedDate.setHours(session.userData.avble[results.response.entity]);

    // Google Calendar API call similar to listEvents
    calendarAPI.createEventAPI(reservedDate, function() {
      session.send("Congratulations! Your reservation has been made for " + reservedDate);
      session.endDialog(); //always need to end dialog to refresh the convo
    });
  }
])


dialog.matches('reservation', [
  function (session, args, next) {
    // begin reservation process
    builder.Prompts.time(session, 'Which day would you like to make the reservation for? (Mon~Sun)');
  }, function (session, results, next) {
    // get user's preferred day, and get available timeslots on that day
    var inputDate = builder.EntityRecognizer.resolveTime([results.response]);
    session.userData.date = inputDate;
    session.send("The date you gave was " + inputDate);

    // make a call to Google Calendar API. The anonymous function passed in is triggered as a callback
    // after the events variable has been populated from Google Calendar.
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
          avble[i.toString() + ":00"] = i;
        }
      }
      session.userData.avble = avble;

      // give the user choice of available timeslot
      builder.Prompts.choice(session, "These are the available timeslots on " +  
        days[inputDate.getDay()] + ". What's good for you? (24 hr format)", avble, {listStyle:3});
    });
  }, function (session, results) {
    // create an event in the Google Calendar for user's chosen timeslot.
    var reservedDate = new Date(session.userData.date);
    reservedDate.setHours(session.userData.avble[results.response.entity]);

    // Google Calendar API call similar to listEvents
    calendarAPI.createEventAPI(reservedDate, function() {
      session.send("Congratulations! Your reservation has been made for " + reservedDate);
      session.endDialog();//
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
    session.send('Available Services & Price\n * Women\'s Short Hair - $25\n * Women\'s Long Hair - $28\n * Men\'s Hair - $22\n * Children\'s Hair - $15\n * Color - $45+\n * Perm - $55+\n * Facial Waxing - $25+\n * Shampoo - $5');
    session.endDialog();
  }
])

/* Newly Added Intents */


dialog.matches('swear', [
  function (session, args, next) {
        session.send('Please use appropriate language');
        session.endDialog();
  }
])

dialog.matches('exit', [
  function (session, args, next) {
        session.send('Please comeback again!');
        session.endDialog();
  }
])


