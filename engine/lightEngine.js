const request = require('request');
var moment = require('moment');
require("moment-duration-format");
const communication = require('./../communication/request');
var settingsHelper = require('./../settings/settingsWriter');
var directions = require('./../api/directions');

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
    
    // implement some sort of security in the system when we send stuff to the backend from the frontend to eleminate faul use
    // when anyone is home call appropiate function
    if(priArray.length != 0){
        console.log('someone is home - Turning on the light as specified by: ' + priArray[0]);
        turnOnLightWithUserPreferences();
    }else{
        console.log('Prioritation list is empty!(no is home) - Turning off light!');
    }
}

var turnOnLightWithUserPreferences = function(){
    settingsHelper.getSettingsByAttributes('mac_address', priArray[0], function(settingsFromPrioritizedUser){
        console.log('settings fetches for prioritized user '+ '\n' + JSON.stringify(settingsFromPrioritizedUser));
    })
    //load user settings from priArray index 0
    //sanitize 
    // info to get : on/off, brightness, color

    //communication.toggleLightWithUserSettings();
}



var checkIfUserShouldBeLeavingHome = function (){
    // TODO get event date from every user calender (should maybe be its whole own method and should input to this method)
    var d = new Date();
    console.log(d.toLocaleString('en-GB', { hour12: false }));
    var now = d.toLocaleString('en-GB', { hour12: false })
    var event = "11/20/2017, 23:51:34";
    
    var ms = moment(now,"MM/DD/YYYY HH:mm:ss").diff(moment(event,"MM/DD/YYYY HH:mm:ss"));
    var d = moment.duration(ms);
    var s = d.format("hh:mm:ss");
    console.log('difference ' + s);

    // TODO program condition that alerts user with specified lighting signal if event is within specified time range
    // TODO Implement weather API that might also show what the weather is at this time
} 

setInterval(function () { 
    checkIfUserShouldBeLeavingHome();
}, 2000); 


module.exports = { 
    start,
    prioritizeUserRights
    // checkForBluetoothChanges
};