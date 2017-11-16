const request = require('request');

module.exports.sendMacToPi = (macAddress) => {
    console.log('sending request + ' + macAddress);
    request.post(
        `http://192.168.0.106:8484/pi/sensors/bluetooth/users`, {
            json: {
                macAddress: macAddress
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                
            }
        }
    );
}

