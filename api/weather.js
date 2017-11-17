const request = require('request');

var weather_API = 'http://api.openweathermap.org/data/2.5/weather?q=Aarhus,%20DK&appid=fd525910006e703a7afaf8b6852bf461&units=metric';

var getWeather = () => {
  request(weather_API, function (error, response, body) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
      console.log('weather for today is');
      var data = JSON.parse(body); 
      var weather = data.weather;
      console.log(weather[0].main);
    });
}

module.exports = {
  getWeather
};