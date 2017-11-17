const request = require('request');

var PI_LOCAL_IP = '192.168.0.106:8484'; // Local base IP on the Raspberry PI 

module.exports.sendMacToPi = (macAddress) => {
    console.log('sending request with mac address(s) to Raspberry pi --> ' + macAddress);
    request.post(
        `http://${PI_LOCAL_IP}/pi/sensors/bluetooth/users`, {
            json: {
                macAddress: macAddress
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(response.statusCode);
            }else {
                console.log('ERROR response from Raspberry Pi ');
            }
        }
    );
}

module.exports.onOffLight = function(url,state){
    console.log(url);
      request.put(
        url, {
          json: {
          "on": state
          }
        },
        function(error,response,body){
          if(!error && response.statusCode == 200){
  
          }
        }
      );
  };

