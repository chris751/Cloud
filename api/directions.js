

const request = require('request');

var API_KEY = 'AIzaSyB7IQtJAtVXXQjxn7LqAgjDwlUCR7qkJAw';
var GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json?';
var ORIGIN = encodeURI('Grete Løchtes Gade 1, 9-4, 8000, aarhus'); //encode for URL friendliness
var DESTINATION = encodeURI('Åbogade 34, 8200 Aarhus N, Danmark'); //encode for URL friendliness
var TRAVEL_MODE = 'walking'; 
var REQUEST_URL = `${GOOGLE_BASE_URL}origin=${ORIGIN}&destination=${DESTINATION}&mode=${TRAVEL_MODE}&key=${API_KEY}`


var getTravelTime = () => {
  //console.log(REQUEST_URL);
  //console.log('https://maps.googleapis.com/maps/api/directions/json?origin=Grete%20L%C3%B8chtes%20Gade%201,%209-4,%208000,%20aarhus&destination=%C3%85bogade%2034,%208200%20Aarhus%20N,%20Danmark&mode=transit&key=AIzaSyB7IQtJAtVXXQjxn7LqAgjDwlUCR7qkJAw');
  request(REQUEST_URL, function (error, response, body) {
      // console.log('error:', error); // Print the error if one occurred
      // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.

      // console.log(body.routes[0].bounds);
      // console.log('weather for today is');
      var data = JSON.parse(body); 
      var weather = data.routes;
      console.log(weather[0].legs[0].duration);
    });
}

module.exports = {
  getTravelTime
};