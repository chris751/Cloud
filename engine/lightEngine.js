const request = require('request');
const communication = require('./../communication/request');
var settingsHelper = require('./../api/weather');

var start = (settings) => {
    checkForChanges(settings);
}

var checkForChanges = (settings) => {
    newAddressArray = [];
    oldAddressArray = [];
    for (i = settings.length - 1; i >= 0; --i) {
        if (settings[i].mac_address) {
            newAddressArray.push(settings[i].mac_address);
            
        }
    }
    if(newAddressArray != oldAddressArray){
        communication.sendMacToPi(newAddressArray);
    }

    oldAddressArray = newAddressArray;
}

module.exports = { 
    start
};