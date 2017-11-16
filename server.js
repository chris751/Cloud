var express = require('express');
var cors = require('cors')
var bodyParser = require('body-parser');
var request = require('request');
var google = require('googleapis');
var exphbs = require('express-handlebars');
var session = require('express-session');
var cookieParser = require('cookie-parser');

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

app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true
  }
}))

var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];

app.get('/', function (req, res) {
  res.render('home.hbs');
});

app.get('/login', function (req, res) {
  googleHelpers.getClient(function (oauth2Client) {
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    res.redirect(url);
  })
});

app.get('/auth/google/callback', function (req, res) {
  var code = req.query['code'];
  googleHelpers.getClient(function (oauth2Client) {
    googleHelpers.getToken(oauth2Client, code, function (err, tokens) {
      if (!err) {
        oauth2Client.setCredentials(tokens);
        googleHelpers.listCalendarEvents(oauth2Client, google);
        googleHelpers.gAuth(oauth2Client, function (userInfo) {
          if (userInfo !== 'error') {
            req.session.user_id = userInfo.id;
            req.session.name = userInfo.name;
            res.redirect('/profile'); // when authenticated send to profile site
          }
        })
      } else {
        res.send('error');
      }
    })
  });
});

app.get('/profile', function (req, res) {

  // TODO load settings into cookie 

  if (req.session.user_id) { // check if id is present in cookie 
    settingsHelper.fetchSpecificSetting(req.session.user_id, function(settingInfo){
      console.log(settingInfo);
      res.render('profile.hbs', {
        name: req.session.name,
        id: req.session.user_id,
        settings: settingInfo
      });
    });
    
  } else { // user not authenticated
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