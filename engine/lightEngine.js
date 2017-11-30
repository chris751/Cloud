
const request = require('request');
var moment = require('moment');
require("moment-duration-format");
const communication = require('./../communication/request');
const constants = require('./../communication/constants');
var settingsHelper = require('./../settings/settingsWriter');
var tokenWriter = require('./../settings/tokenWriter');
var directions = require('./../api/directions');
var weather = require('./../api/weather');
var googleHelpers = require('./../helpers/googleHelpers');

var priArray = [];

var start = (settings) => {
    //evaluateLightingConditions();
    checkForChanges(settings);
    //checkAll();
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

var prioritizeUserRights = function (macAddress, state, callback) {
    console.log('called with');
    console.log(macAddress);

    if (state == true) {
        console.log('adding user to prioritation');
        priArray.push(macAddress);
        console.log(priArray);
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
        checkAll();
    } else {
        console.log('Prioritation list is empty!(no one is home) - Turning off light!');
        toggleLight(false, null, null);
    }
}

//setInterval(evaluateLightingConditions, 10000);

var checkIfLightShouldNotifyuser = () => {
    //turnOnLightWithUserPreferences();
    fetchCalendarEventsFromUsersThatAreHome((event, settingsFromPriArray) => {
        console.log('received callback');
        var eventMatchesSettings = false;
        var eventindex;
        var eventJ; 
        var currentSettings;
        for (j = 0; j < settingsFromPriArray.length; j++) {
            console.log('received callback');
            if (event.id == settingsFromPriArray[j].userInfo.profile_id) {
                console.log('equals');
                var travelMode = settingsFromPriArray[j].settings.calendar_settings.travel_mode;
                for (i = 0; i < settingsFromPriArray[j].settings.calendar_settings.event_name.length; i++) {
                    if(typeof(settingsFromPriArray[j].settings.calendar_settings.event_name) != 'string'){
                    var eventName = settingsFromPriArray[j].settings.calendar_settings.event_name[i];
                    currentSettings = settingsFromPriArray[j];
                    console.log(typeof(eventName));
                    console.log(eventName);
                    console.log(event.summary);
                    if (eventName == event.summary) {
                        console.log('event matched user setttings');
                        eventindex = i;
                        eventJ = j;
                        eventMatchesSettings = true;
                    }
                }else {
                    var event22 = settingsFromPriArray[j].settings.calendar_settings.event_name;
                    currentSettings = settingsFromPriArray[j];
                    console.log(event22);
                    console.log(event.summary);
                    if (event22 == event.summary) {
                        console.log('event matched user setttings');
                        eventindex = i;
                        eventJ = j;
                        eventMatchesSettings = true;
                    }
                }
                }
                if (settingsFromPriArray[j].settings.calendar_settings.weatherEnabled != undefined) {
                    var weatherEnabled = true;
                }
            }
        }
        if (eventMatchesSettings) {
            checkIfUserShouldBeLeavingHome(event, currentSettings, travelMode, function (shouldLeave, timeToEvent) {
                if (shouldLeave) {
                    console.log('blink blink - You should leave for work now!');
                    if(typeof(settingsFromPriArray[eventJ].settings.calendar_settings.calender_notification_color) != 'string'){
                    var colorPrefs = settingsFromPriArray[eventJ].settings.calendar_settings.calender_notification_color[eventindex];
                }else {
                    var colorPrefs = settingsFromPriArray[eventJ].settings.calendar_settings.calender_notification_color;
                }
                    console.log(colorPrefs);
                    toggleLight(true, colorPrefs, null, (response) => {
                        console.log('reponse is');
                        console.log(response);
                        communication.notificationLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/blink', 6);
                    });

                    if (weatherEnabled) {
                        var callWeather = () => {
                            switchToweatherColor(currentSettings);
                        }
                        setTimeout(callWeather, 8000) 
                     
                    }
                } else {
                    console.log('Not time to leave yet , you are due to leave in ' + timeToEvent / 60 + ' minutes');
                    //call method again when user actually has to leave
                    setTimeout(evaluateLightingConditions, timeToEvent * 1000 + 10000) // convert seconds to ms, wait 10 secs ekstra to be sure its go time
                }
            });
        }
    });
}

var checkAll = () => {
    checkSettingsToTurnOnLight(); // turn on light with user specified settings
    checkIfLightShouldNotifyuser(); // checks if user should be leaving home
    //checkWeatherData(); // gets current weather data and adjust lighting according to weather settings
}


var checkSettingsToTurnOnLight = () => {
    fetchSettingsFromPriArray((settingsFromPriArray) => {
        var homeSettings;
        for (i = 0; i < settingsFromPriArray.length; i++) {
            if (settingsFromPriArray[i].userInfo.mac_address == priArray[0]) {
                homeSettings = settingsFromPriArray[i].settings.is_home_settings;
            }
        }

        //var isHomeSetting = settingsFromPriArray[0].settings.is_home_settings;
        var color = homeSettings.color;
        var brightness = homeSettings.brightness;
        console.log('turning on light with: ');
        console.log(color, brightness);
        toggleLight(true, color, brightness);
    });
}

var switchToweatherColor = (settings) => {
    weather.getWeather(settings, (weather) => {
        console.log('got weahter data : ' + weather);
        if (weather == 'Rain') {
            console.log('rain');
            toggleLight(true, '#4259f4', null);
        } else if (weather == 'Drizzle') {
            console.log('rain');
            toggleLight(true, '#4259f4', null);
        } else if (weather == 'Thunderstorm') {
            console.log('thunderstorm');
            toggleLight(true, '#4259f4', null);
        } else if (weather == 'Snow') {
            console.log('Snow');
            toggleLight(true, '#ffffff', null);
        } else if (weather == 'Clear') {
            console.log('Clear');
            toggleLight(true, '#ff9900', null);
        } else if (weather == 'Clouds') {
            console.log('clouds');
            toggleLight(true, '#236b9b', null);
        } else if (weather == 'Extreme') {
            console.log('Extreme');
        } else if (weather == 'Additional') {
            console.log('Additional');
        } else {
            console.log('did not understand weather data');
        }
    });
}


var toggleLight = (state, color, brightness, callback) => {
    communication.adjustLight(constants.PI_LOCAL_IP + '/pi/actuators/lights/1/functions/onoff', state, color, brightness, callback);
}

// fetch settings from users that are home
var fetchSettingsFromPriArray = function (callback) {
    settingsHelper.getSettingsFromPriArray('mac_address', priArray, (settingsFromPriArray) => {
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

var checkIfUserShouldBeLeavingHome = function (event, settings, travel_mode, callback) {
    console.log('checking how long is takes to be using: ' + travel_mode + ' to get to ' + event.location);
    if (!event.location) {
        console.log('remember to add a location in the calendar event');
        return;
    }
    console.log('settings');
    console.log(settings);
    directions.getTravelTime(travel_mode, event.location, settings.userInfo.home_address, function (travelDuration) {
        var eventStart = event.start.dateTime || event.start.date;
        var timeToEvent = compareTime(eventStart);
        travelDuration = travelDuration + 5 * 60; // give 5 minutes headroom
        console.log('it will take: ' + travelDuration / 60 + ' minutes ' + 'and there is: ' + timeToEvent / 60 + ' untill the event begins');
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
    prioritizeUserRights,
    evaluateLightingConditions
};