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
    evaluateLightingConditions();
}

var evaluateLightingConditions = () => {
    if (priArray.length != 0) {
        console.log('someone is home - Turning on the light as specified by: ' + priArray[0]);
        checkIfLightShouldNotifyuser();
    } else {
        console.log('Prioritation list is empty!(no one is home) - Turning off light!');
        communication.onOffLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/onoff', false)
    }
}


var checkIfLightShouldNotifyuser = () => {
    toggleLight(true) // turn on light
    //turnOnLightWithUserPreferences();
    fetchCalendarEventsFromUsersThatAreHome( (event, settingsFromPriArray) => {
        eventMatchesSettings = false;
        console.log('here is a event');
        console.log(event);
        console.log('here are the settigns');
        console.log(settingsFromPriArray);
            for (j = 0; j < settingsFromPriArray.length; j++) {
                if (event.id == settingsFromPriArray[j].userInfo.profile_id) {
                    console.log(event.id + ' matched ' + settingsFromPriArray[j].userInfo.profile_id);
                    var travelMode = settingsFromPriArray[j].settings.calendar_settings.travel_mode;
                    var eventName = settingsFromPriArray[j].settings.calendar_settings.event_name;
                    if (eventName == event.summary) {
                        console.log('event matched user setttings');
                        eventMatchesSettings = true;
                    } else {
                        console.log('event did not match user settings');
                        console.log(eventName + '/=' + event.summary);
                        eventMatchesSettings = false;
                    }
                }
            }
        
            if (eventMatchesSettings) {
                checkIfUserShouldBeLeavingHome(event, event.id, travelMode, function (shouldLeave, timeToEvent) {
                    if (shouldLeave) {
                        console.log('blink blink - You should leave for work now!');
                        communication.notificationLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/blink', 6);
                    } else {
                        console.log('Not time to leave yet , you are due to leave in ' + timeToEvent / 60 + ' minutes');
                        //call method again when user actually has to leave
                        setTimeout(evaluateLightingConditions, timeToEvent * 1000 + 10000) // convert seconds to ms, wait 10 secs ekstra to be sure its go time
                    }
                });
            }
    });
}


var toggleLight = (state) => {
    communication.onOffLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/onoff', state);
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
    fetchSettingsFromPriArray((settingsFromPriArray) => {
        var calendarEvents = [];
        var userIdArray = [];
        for (i = 0; i < settingsFromPriArray.length; i++) {
            var userId = settingsFromPriArray[i].userInfo.profile_id;
            // var travel_mode = settingsFromPriArray[0].settings.calendar_settings.travel_mode;
            userIdArray.push(userId);
        }
        fetchTokens(userIdArray, (tokens) => {
            for (i = 0; i < tokens.length; i++) {
                fetchCalendarEvents(tokens[i], (calendarEvent) => {
                    console.log('i have fetched the events for ' + i + ' users');
                    console.log(calendarEvent)
                    callback(calendarEvent, settingsFromPriArray);
                });
            }
        });
    })
}

var fetchCalendarEvents = (token, callback) => {
    googleHelpers.getClient(function (oauth2Client) {
        oauth2Client.setCredentials(token.token);
        googleHelpers.listCalendarEvents(oauth2Client, token.id, function (events) {
            callback(events[0]); // we only want the first event, since that is the upcomming event
        });
    });
}

var checkIfUserShouldBeLeavingHome = function (event, userId, travel_mode, callback) {
    console.log('checking how long is takes to be using: ' + travel_mode + ' to get to ' + event.location);
    directions.getTravelTime(travel_mode, event.location, function (travelDuration) {
        var eventStart = event.start.dateTime || event.start.date;
        var timeToEvent = compareTime(eventStart);
        travelDuration = travelDuration + 5 * 60; // give 5 minutes headroom
        console.log('it will take: '+ travelDuration/60 + ' minutes ' +  'and there is: ' + timeToEvent/60 + ' untill the event begins');
        if (travelDuration >= timeToEvent && timeToEvent != 'e') { // give 5 minutes headroom
            callback(true, timeToEvent - travelDuration);
        } else if (timeToEvent != 'e') {
            callback(false, timeToEvent - travelDuration);
        } else {
            console.log('event has passed');
        }
    });
}

var compareTime = function (event) {
    var d = new Date();
    // console.log(d.toLocaleString('en-GB', {
    //     hour12: false
    // }));
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
        return 'e'; // event has already begun
    }
}

module.exports = { 
    start,
    prioritizeUserRights
    // checkForBluetoothChanges
};