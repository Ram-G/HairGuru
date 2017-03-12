var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var calendarId = '9og0pboev8t3hpush344u1e1tk@group.calendar.google.com'
// FireBase setup
var firebase = require('firebase');

// Initialize Firebase -- CURRENTLY NOT USED
var config = {
  apiKey: "AIzaSyAxylt6M3T3bVfJiXPrpW_n4Cws-6BTf3s",
  authDomain: "hairguru-159817.firebaseapp.com",
  databaseURL: "https://hairguru-159817.firebaseio.com",
  storageBucket: "hairguru-159817.appspot.com",
  messagingSenderId: "187057722076"
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();

function writeUserData(userId, name, email, imageUrl) {
  database.ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar'];
// var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '.credentials/';
var TOKEN_DIR = '.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Load client secrets from a local file.
function listEventsAPI(callback) {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), listEvents, callback);
  });
}

var date = {};
function createEventAPI(d, callback) {
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    date = d;
    authorize(JSON.parse(content), createEvent, callback);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, callback2) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, callback2);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, callback) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: calendarId,
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    console.log(events)
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      callback(events);
    }
  });
}

function createEvent(auth, callback) {
  var endDate = new Date(date.getTime());
  endDate.setHours(endDate.getHours() + 1);
  var event = {
    'summary': 'XYZ Barber appointment',
    'start': {
      'dateTime': date.toISOString(),
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'dateTime': endDate.toISOString(),
      'timeZone': 'America/Los_Angeles',
    }
  };

  var calendar = google.calendar('v3');
  calendar.events.insert({
    auth: auth,
    calendarId: calendarId,
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    callback();
  });
}

module.exports = {
  listEventsAPI: function(callback) {
    return listEventsAPI(callback);
  },
  createEventAPI: function(date, callback) {
    return createEventAPI(date, callback);
  }
}