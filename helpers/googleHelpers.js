var google = require('googleapis');
var GoogleAuth = require('google-auth-library');


var OAuth2 = google.auth.OAuth2;

// generate a url that asks permissions for Google+ and Google Calendar scopes

var ENVIROMENT_URL = 'https://f1a545e0.ngrok.io';
var CALLBACK_URL = `${ENVIROMENT_URL}/auth/google/callback`;

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
exports.listCalendarEvents = function (auth, googles) {
    var calendar = googles.calendar('v3');
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function (err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var events = response.items;
      if (events.length == 0) {
        console.log('No upcoming events found.');
      } else {
        console.log('Upcoming 10 events:');
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var start = event.start.dateTime || event.start.date;
          console.log('%s - %s', start, event.summary);
        }
      }
    });
  }

exports.gAuth = function (oauth2Client, callback) {
  google.oauth2("v2").userinfo.v2.me.get({
    auth: oauth2Client
  }, (e, profile) => {
    if (!e) {
      console.log(profile.id);
      callback(profile);
    } else {
      callback('error');
    }
  });
}

exports.getClient = function (callback) {
  var oauth2Client = new OAuth2(
    '260827620000-n22fb3grjj24e46jr6ul88tnngfh10bd.apps.googleusercontent.com',
    '-0SPco82-qUcX42eMOJpGqnw',
    CALLBACK_URL
  );
  console.log(ENVIROMENT_URL);
  console.log(CALLBACK_URL);
  callback(oauth2Client);
}

