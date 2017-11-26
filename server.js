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
var tokenWriter = require('./settings/tokenWriter');
const communication = require('./communication/request');
const lightEngine = require('./engine/lightengine');
const format = require('./helpers/format');
const constants = require('./communication/constants');

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
  secret: 'keyboard catsdsdfj1123',
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

        googleHelpers.gAuth(oauth2Client, function (userInfo) {
          if (userInfo !== 'error') {
            req.session.user_id = userInfo.id;
            tokenWriter.saveAuthToFile(tokens, userInfo.id)
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
        userInfo: settingInfo
      });
    });

  } else { // user not authenticated
    console.log('not authticated');
    res.redirect('/');
  }
});

// this endpoint is called from the Raspberry PI on boot to get the MAC addresses stored in the settings file
app.get('/bluetoothdata', function (req, res) {
  console.log('recieved request for all BlueTooth MAC addresses in the cloud');
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
  //console.log(request.body);
  var user;
  format.formatSettings(request.body, function (formattedSettings) {
    user = formattedSettings;
  })

  settingsHelper.addNote(user, function response() {
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
  //settingsHelper.addAttribute(macAddress, state);
  lightEngine.prioritizeUserRights(macAddress, state, function (prioritationList) { // prioritize users 
    console.log('prioritation list = ' + prioritationList);
    res.send('OK');
  })
  //communication.onOffLight('http://192.168.0.108/api/zwxLWe5QUN6m3R0F92GoSOdT6rvq0cPw6THRxfJA/lights/1/state',state);
});

//
app.put('/sensors/light', function (req, res) {
  //console.log('test put received');
  console.log(req.body.LightValue.value);
  var light = req.body.LightValue.value
  if (light < 300) {
    communication.adjustBrightness(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/adjustBrightness', 254);
  } else if (light < 800) {
    communication.adjustBrightness(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/adjustBrightness', 100)
  } else {
    communication.adjustBrightness(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/adjustBrightness', 0)
  }
  res.send('OK');
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});