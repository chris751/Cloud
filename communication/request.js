const request = require('request');
var constants = require('./constants');

module.exports.sendMacToPi = (macAddress) => {
    console.log('sending request with mac address(s) to Raspberry pi --> ' + macAddress);
    request.post(
        `${constants.PI_LOCAL_IP}/pi/sensors/bluetooth/users`, {
            json: {
                macAddress: macAddress
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(response.statusCode);
            }else {
                console.log('error response from Raspberry Pi!');
            }
        }
    );
}

// module.exports.onOffLight = function(url,state){
//     console.log(url);
//       request.put(
//         url, {
//           json: {
//           "on": state
//           }
//         },
//         function(error,response,body){
//           if(!error && response.statusCode == 200){
  
//           }
//         }
//       );
//   };


  module.exports.adjustLight = function(url,state, color, brightness, callback){
    console.log(url);
    console.log(state, color, brightness);
    var intBri = parseInt(brightness);
      request.put(
        url, {
          json: {
          "on": state,
          "hex": color,
          "brightness": intBri
          }
        },
        function(error,response,body){
          if(!error && response.statusCode == 200){
            if(callback != undefined){
              callback(response.statusCode);
            }
          }
        }
      );
  };


module.exports.notificationLight = function(url,state){
    console.log(url);
    console.log(state);
      request.put(
        url, {
          json: {
          "number": state
          }
        },
        function(error,response,body){
          if(!error && response.statusCode == 200){
            //console.log(response);
            
          }else {
              console.log(error);
          }
        }
      );
  };


  module.exports.adjustBrightness = function(url,state){
    console.log(url);
    console.log(state);
      request.put(
        url, {
          json: {
          "brightness": state
          }
        },
        function(error,response,body){
          if(!error && response.statusCode == 200){
            
          }else {
              console.log(error);
          }
        }
      );
  };

  


