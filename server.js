var express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser');
var request = require('request');
var google = require('googleapis');
var GoogleAuth = require('google-auth-library');
var exphbs = require('express-handlebars');

var handlebars = require('./helpers/handlebars.js')(exphbs);
var googleHelpers = require('./helpers/googleHelpers');
var settingsHelper = require('./settings/settingsWriter');

var app = express();
app.use(cors());

app.engine('hbs', handlebars.engine);

app.set('view engine', 'hbs');
app.set('port', (process.env.PORT || 5000));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}));
// parse application/json
app.use(bodyParser.json())

var OAuth2 = google.auth.OAuth2;

var TOKEN_PATH = './users/tokens.json';

var oauth2Client = new OAuth2(
  '260827620000-n22fb3grjj24e46jr6ul88tnngfh10bd.apps.googleusercontent.com',
  '-0SPco82-qUcX42eMOJpGqnw',
  'http://localhost:8080/auth/google/callback'
);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];

app.get('/', function (req, res) {
  res.render('home.hbs');
});

app.get('/login', function (req, res) {
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

app.get('/auth/google/callback', function (req, res) {
  var code = req.query['code'];
  console.log(code);

  oauth2Client.getToken(code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      console.log(tokens);
      oauth2Client.setCredentials(tokens);
      googleHelpers.listCalendarEvents(oauth2Client, google);
      res.redirect('/profile'); // when authenticated send to profile site
    } else {
      res.send('error');
    }
  });
});

app.get('/profile', function (req, res) {
  google.oauth2("v2").userinfo.v2.me.get({
    auth: oauth2Client
  }, (e, profile) => {
    if (!e) {
      res.render('profile.hbs', {
        name: profile.name,
        id: profile.id
      });
    } else {
      res.redirect('/login'); // the user wasn't logged in, so we redirect them to the login page
    }
  });
});

app.post('/settings', function (request, res) {
  settingsHelper.addNote(request.body, function response(){
    res.send('saved!');
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
console.log('server is up on port 8080');