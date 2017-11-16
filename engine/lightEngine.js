const request = require('request');
const communication = require('./../communication/request');

var start = (settings) => {
    console.log('changes were made');
    console.log(settings);
    checkForChanges(settings);
}

var checkForChanges = (settings) => {
    for (i = settings.length - 1; i >= 0; --i) {
        if (settings[i].mac_address) {
            communication.sendMacToPi(settings[i].mac_address);
            console.log('sending ' + settings[i].mac_address);
        }
    }
}

module.exports = { 
    start
};