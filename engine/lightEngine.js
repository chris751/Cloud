const request = require('request');
const communication = require('./../communication/request');
var settingsHelper = require('./../settings/settingsWriter');

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
        turnOnLightWithUserPreferences();
    }
}

var turnOnLightWithUserPreferences = function(){
    settingsHelper.getSettingsByMacAddress(priArray[0], function(settingsFromPrioritizedUser){
        console.log('settings fetches for prioritized user '+ '\n' + JSON.stringify(settingsFromPrioritizedUser));
    })
    //load user settings from priArray index 0
    //sanitize 
    // info to get : on/off, brightness, color

    //communication.toggleLightWithUserSettings();
}






module.exports = { 
    start,
    prioritizeUserRights
    // checkForBluetoothChanges
};