
const request = require('request');

var API_KEY = 'AIzaSyB7IQtJAtVXXQjxn7LqAgjDwlUCR7qkJAw';
var GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json?';
var ORIGIN = encodeURI('Grete Løchtes Gade 1, 9-4, 8000, aarhus'); //encode for URL friendliness
var DESTINATION = encodeURI('Åbogade 34, 8200 Aarhus N, Danmark'); //encode for URL friendliness
var TRAVEL_MODE = 'driving'; 
//var REQUEST_URL = `${GOOGLE_BASE_URL}origin=${ORIGIN}&destination=${DESTINATION}&mode=${TRAVEL_MODE}&key=${API_KEY}`



var getTravelTime = (travelMode, destination, callback) => {
  DESTINATION = encodeURI(destination);
  TRAVEL_MODE = travelMode;
  var REQUEST_URL = `${GOOGLE_BASE_URL}origin=${ORIGIN}&destination=${DESTINATION}&mode=${TRAVEL_MODE}&key=${API_KEY}`

  request(REQUEST_URL, function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      // console.log(body.routes[0].bounds);
      // console.log('weather for today is');
      var data = JSON.parse(body); 
      var weather = data.routes;
      var secondsToDuration = weather[0].legs[0].duration.value;
      var minsToDestination = parseInt(secondsToDuration);
      //var minsToDestination = duration/60;
      callback(minsToDestination); //duration
    });
}

module.exports = {
  getTravelTime
};