var express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser');
var request = require('request');
var google = require('googleapis');
var GoogleAuth = require('google-auth-library');
var exphbs = require('express-handlebars');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var handlebars = require('./helpers/handlebars.js')(exphbs);
var googleHelpers = require('./helpers/googleHelpers');
var settingsHelper = require('./settings/settingsWriter');


var app = express();
app.use(cors());



var url = require('url');

app.engine('hbs', handlebars.engine);

app.set('view engine', 'hbs');
app.set('port', (process.env.PORT || 5000));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}));
// parse application/json
app.use(bodyParser.json())

app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

var TOKEN_PATH = './users/tokens.json';
var ENVIROMENT_URL = 'https://f1a545e0.ngrok.io';
var CALLBACK_URL = `${ENVIROMENT_URL}/auth/google/callback`;

var OAuth2 = google.auth.OAuth2;

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];


app.get('/', function (req, res) {
  res.render('home.hbs');
});

app.get('/login', function (req, res) {
  getClient(function (oauth2Client) {

    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    res.redirect(url);
  })
});

app.get('/auth/google/callback', function (req, res) {


  var code = req.query['code'];
  //console.log(code);


  getClient(function (client) {
    var oauth2Client = client;



    oauth2Client.getToken(code, function (err, tokens) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
      if (!err) {
        //console.log(tokens);
        oauth2Client.setCredentials(tokens);
        googleHelpers.listCalendarEvents(oauth2Client, google);
        gAuth(oauth2Client, function (userInfo) {
          if (userInfo !== 'error') {
            console.log(userInfo.id);
            console.log(userInfo.name);
            req.session.user_id = userInfo.id;
            req.session.name = userInfo.name;
            res.redirect('/profile'); // when authenticated send to profile site
          }
        })
      } else {
        res.send('error');
      }
    });
  });
});


var gAuth = function (oauth2Client, callback) {
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


// something
var getClient = function (callback) {
  var oauth2Client = new OAuth2(
    '260827620000-n22fb3grjj24e46jr6ul88tnngfh10bd.apps.googleusercontent.com',
    '-0SPco82-qUcX42eMOJpGqnw',
    CALLBACK_URL
  );
  console.log(ENVIROMENT_URL);
  console.log(CALLBACK_URL);
  callback(oauth2Client);
}

app.get('/profile', function (req, res) {
  console.log(req.session.user_id);
  console.log(req.session.name);
  if (req.session.user_id) {
    res.render('profile.hbs', {
      name: req.session.name,
      id: req.session.user_id
    });
  }else {
    res.redirect('/');
  }
});

app.post('/settings', function (request, res) {
  console.log(request.body);
  settingsHelper.addNote(request.body, function response() {
    res.send('saved!');
  });
});


app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});