const request = require('request');
var moment = require('moment');
require("moment-duration-format");
const communication = require('./../communication/request');
var settingsHelper = require('./../settings/settingsWriter');
var directions = require('./../api/directions');
var googleHelpers = require('./../helpers/googleHelpers');


var start = (settings) => {
    checkForChanges(settings);
    //checkForBluetoothChanges(settings);
}

var newAddressArray = [];
var oldAddressArray = [];

var checkForChanges = (settings) => {
    for (i = settings.length - 1; i >= 0; --i) {
        if (settings[i].mac_address) {
            newAddressArray.push(settings[i].mac_address);
        }
    }
    if (newAddressArray != oldAddressArray) {
        communication.sendMacToPi(newAddressArray);
    }
    oldAddressArray = newAddressArray;
}

var priArray = [];

var prioritizeUserRights = function (macAddress, state, callback) {
    if (state == 'true') {
        console.log('adding user to prioritation');
        priArray.push(macAddress);
    } else {
        for (i = 0; i < priArray.length; i++) {
            if (priArray[i] == macAddress) {
                console.log('deleting user from prioritation');
                console.log(priArray);
                priArray.splice(i, 1);
                console.log(priArray);
            }
        }
    }
    callback(priArray);
    // TODO only call this when the user is controlled is actually changed and not just whenever some change has been done.
    // TODO refactor settingsWriter so that functions that only read are in a separate file
    // TODO FINDABILITY - Raspberry PI should send avalable devices in home network with their properties, that is then available in the UI 
    
    // implement some sort of security in the system when we send stuff to the backend from the frontend to eleminate faul use

    // when anyone is home call appropiate function
    if(priArray.length != 0){
        console.log('someone is home - Turning on the light as specified by: ' + priArray[0]);
        //turnOnLightWithUserPreferences();
        fetchSettingsFromPriArray();

    }else{
        console.log('Prioritation list is empty!(no one is home) - Turning off light!');
    }
}

var turnOnLightWithUserPreferences = function(){
    settingsHelper.getSettingsByAttributes('mac_address', priArray[0], function(settingsFromPrioritizedUser){
        console.log('settings fetches for prioritized user '+ '\n' + JSON.stringify(settingsFromPrioritizedUser));
    })
    // load user settings from priArray index 0
    // sanitize 
    // info to get : on/off, brightness, color

    // communication.toggleLightWithUserSettings();
}

// fetch settings from users that are home
var fetchSettingsFromPriArray = function (){
    settingsHelper.getSettingsFromPriArray('mac_address', priArray, function(settingsFromPriArray){
        var tokens = settingsFromPriArray[0].userInfo.tokens;
        var userId = settingsFromPriArray[0].userInfo.profile_id;
        var travel_mode = settingsFromPriArray[0].settings.calendar_settings.travel_mode;
        //fetch calendar data from all users aswell
        for (i = 0; i < settingsFromPriArray.length; i++) { 

        }
        googleHelpers.getClient(function (oauth2Client) {
            oauth2Client.setCredentials(tokens);
            googleHelpers.listCalendarEvents(oauth2Client, function (events){
                console.log('event list');
                console.log(events[0]);
                checkIfUserShouldBeLeavingHome(events[0], userId, travel_mode, function (shouldLeave){
                    if(shouldLeave){
                        console.log('blink blink - You should leave for work now!')
                    }else {
                        console.log('You still have time bro')
                    }
                });
            });
        });
    })
}

var checkIfUserShouldBeLeavingHome = function (event, userId, travel_mode, callback){
    console.log(event.location);
    directions.getTravelTime(travel_mode, event.location, function(travelDuration){
        var eventStart = event.start.dateTime || event.start.date;
        var timeToEvent= compareTime(eventStart);
        travelDuration = travelDuration + 5*60; // give 5 minutes headroom
        
        console.log(travelDuration);
        console.log(typeof(travelDuration));
        console.log(timeToEvent);

        if(travelDuration >= timeToEvent){ // give 5 minutes headroom
            callback(true);
        }else {
            callback(false);
        }
    });

    // TODO get event date from every user calender (should maybe be its whole own method and should input to this method)

    


    // TODO program condition that alerts user with specified lighting signal if event is within specified time range
    // TODO Implement weather API that might also show what the weather is at this time
}

var compareTime = function(event){
    var d = new Date();
    console.log(d.toLocaleString('en-GB', { hour12: false }));
    var now = d.toLocaleString('en-GB', { hour12: false })

    //2017-11-24T08:00:00+01:00
    
    var ms = moment(now,"MM/DD/YYYY HH:mm:ss").diff(moment(event,"YYYY/MM/DD HH:mm:ss"));
    var difference = moment.duration(ms);
    var seconds = difference._milliseconds*0.001;
    seconds = seconds.toString();
    seconds = seconds.replace("-", "");
    parseInt(seconds);
    return seconds; 
}



module.exports = { 
    start,
    prioritizeUserRights
    // checkForBluetoothChanges
};