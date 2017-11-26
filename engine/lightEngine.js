const request = require('request');
var moment = require('moment');
require("moment-duration-format");
const communication = require('./../communication/request');
const constants = require('./../communication/constants');
var settingsHelper = require('./../settings/settingsWriter');
var tokenWriter = require('./../settings/tokenWriter');
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
    if (state == true) {
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
    if (priArray.length != 0) {
        console.log('someone is home - Turning on the light as specified by: ' + priArray[0]);
        communication.onOffLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/onoff', true)
        //turnOnLightWithUserPreferences();
        fetchCalendarEventsFromUsersThatAreHome((allRelevantEvent) => {
            console.log('here are the closest event from all users at home!');
                for (i = 0; i < allRelevantEvent.length; i++) {
                    console.log(allRelevantEvent[i]);
                    checkIfUserShouldBeLeavingHome(allRelevantEvent[i], allRelevantEvent[i].id, 'driving', function (shouldLeave, timeToEvent) {
                        if (shouldLeave) {
                            console.log('blink blink - You should leave for work now!');
                            notificationLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/blink', 6);
                        } else {
                            console.log('Not time to leave yet , you are due to leave in ' + timeToEvent / 60 + ' minutes');
                            //setTimeout(checkIfUserShouldBeLeavingHome, timeToEvent * 1000 + 10000) // convert seconds to ms, wait 10 secs ekstra to be sure its go time
                        }
                    });                 
                }
        });
        //communication.notificationLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/blink', 2);
    } else {
        console.log('Prioritation list is empty!(no one is home) - Turning off light!');
        communication.onOffLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/onoff', false)
    }
}

var turnOnLightWithUserPreferences = function () {
    settingsHelper.getSettingsByAttributes('mac_address', priArray[0], function (settingsFromPrioritizedUser) {
        console.log('settings fetches for prioritized user ' + '\n' + JSON.stringify(settingsFromPrioritizedUser));
    })
    // load user settings from priArray index 0
    // sanitize 
    // info to get : on/off, brightness, color

    // communication.toggleLightWithUserSettings();
}

// fetch settings from users that are home
var fetchSettingsFromPriArray = function (callback) {
    settingsHelper.getSettingsFromPriArray('mac_address', priArray, (settingsFromPriArray) => {
        console.log('callback received');
        console.log(settingsFromPriArray);
        callback(settingsFromPriArray);
    })
}

var fetchTokens = function (userId, callback) {
    tokenWriter.getTokenById(userId, (token) => {
        callback(token)
    });
}

var fetchCalendarEventsFromUsersThatAreHome = (callback) => {
    var calendarEvents = [];
    fetchSettingsFromPriArray((settingsFromPriArray) => {
        var userIdArray = [];
        for (i = 0; i < settingsFromPriArray.length; i++) {
            var userId = settingsFromPriArray[i].userInfo.profile_id;
            // var travel_mode = settingsFromPriArray[0].settings.calendar_settings.travel_mode;
            userIdArray.push(userId);
        }
        fetchTokens(userIdArray, (tokens) => {
           console.log(tokens);
           console.log('called');
            console.log('token list ' + tokens.token)
            for (i = 0; i < tokens.length; i++) {
                var idToSave = tokens[i].id;
                console.log('Id to save' + idToSave);
                fetchCalendarEvents(tokens[i].token, (calendarEvent) => {
                    console.log('i have fetched the events for ' + i + ' us ers');
                    calendarEvent.id = idToSave;
                    console.log(calendarEvent)
                    calendarEvents.push(calendarEvent);
                    if (calendarEvents.length == tokens.length) { // If we are done getting all the calendar events
                        callback(calendarEvents);
                    }
                });
            }
        });
    })

}

var fetchCalendarEvents = (token, callback) => {
    googleHelpers.getClient(function (oauth2Client) {
        oauth2Client.setCredentials(token);
        googleHelpers.listCalendarEvents(oauth2Client, function (events) {
            callback(events[0]);
        });
    });
}

var checkIfUserShouldBeLeavingHome = function (event, userId, travel_mode, callback) {
    console.log(event.location);
    directions.getTravelTime(travel_mode, event.location, function (travelDuration) {
        var eventStart = event.start.dateTime || event.start.date;
        var timeToEvent = compareTime(eventStart);
        travelDuration = travelDuration + 5 * 60; // give 5 minutes headroom

        console.log(travelDuration);
        console.log(typeof (travelDuration));
        console.log(timeToEvent);
        if (travelDuration >= timeToEvent && timeToEvent != 'e') { // give 5 minutes headroom
            callback(true, timeToEvent - travelDuration);
        } else {
            callback(false, timeToEvent - travelDuration);
        }
    });
    // TODO program condition that alerts user with specified lighting signal if event is within specified time range
    // TODO Implement weather API that might also show what the weather is at this time
}

var compareTime = function (event) {
    var d = new Date();
    console.log(d.toLocaleString('en-GB', {
        hour12: false
    }));
    var now = d.toLocaleString('en-GB', {
        hour12: false
    })

    var ms = moment(now, "MM/DD/YYYY HH:mm:ss").diff(moment(event, "YYYY/MM/DD HH:mm:ss"));
    var difference = moment.duration(ms);
    //console.log(difference);
    var seconds = difference._milliseconds * 0.001;
    if (seconds < 0) { // event has not passed
        seconds = seconds.toString();
        seconds = seconds.replace("-", ""); // remove - so that we can compare the numbers
        parseInt(seconds);
        return seconds;
    } else {
        console.log('event has already passed');
        return 'e'; // event has already begun
    }
}



module.exports = { 
    start,
    prioritizeUserRights
    // checkForBluetoothChanges
};