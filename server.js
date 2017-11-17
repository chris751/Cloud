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
const communication = require('./communication/request');
const lightEngine = require('./engine/lightengine');

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
app.use(bodyParser.json());

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

//----- GET -----------
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
  if (req.session.user_id) { // check if id is present in cookie 
    //  console.log('Authticated');
    settingsHelper.fetchSpecificSetting(req.session.user_id, function (settingInfo) {
      // console.log(settingInfo);
      // console.log('session id');
      // console.log(req.session.user_id);
      res.render('profile.hbs', {
        name: req.session.name,
        id: req.session.user_id,
        settings: settingInfo
      });
    });

  } else { // user not authenticated
    console.log('not authticated');
    res.redirect('/');
  }
});

// this endpoint is called from the Raspberry PI on boot to get the MAC addresses stored in the settings file
app.get('/bluetoothdata', function (req, res) {
  console.log('recieved request for BlueTooth MAC addresses');
  settingsHelper.getBluetoothData(function (list) { // get saved bluetooth MAC addresses from settings file
    var obj = {
      macAddress: list
    }
    console.log('Response sent with ' + JSON.stringify(obj));
    res.send(obj);
  })
});

//----- POST-----------
//this endpoint is called from the UI when a user presses the save button
app.post('/settings', function (request, res) {
  console.log('received new settings!');
  console.log(request.body);
  settingsHelper.addNote(request.body, function response() {
    console.log('Saved new settings');
    res.send('saved!');
  });
});


//----- PUT-----------
// this endpoint is called from the Raspberry Pi, whenever a user changes state from being home/not home
app.put('/isuserhome', function (req, res) {
  console.log('Amount of users in home has changed');
  console.log(req.body);
  var state = req.body.state;
  var macAddress = req.body.macAddress;
  settingsHelper.addAttribute(macAddress, state);
  lightEngine.prioritizeUserRights(macAddress, state, function (prioritationList) { // prioritize users 
    console.log('prioritation list = ' + prioritationList);
    res.send('OK');
  })
  //communication.onOffLight('http://192.168.0.108/api/zwxLWe5QUN6m3R0F92GoSOdT6rvq0cPw6THRxfJA/lights/1/state',state);
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});