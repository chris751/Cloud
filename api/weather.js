const request = require('request');


var getWeather = (settings, callback) => {
  googleCoord(settings, (lat, lng) => {
    console.log(lat, lng);
    //var weather_API = `http://api.openweathermap.org/data/2.5/weather?lat=56.162939&lon=10.203921&appid=fd525910006e703a7afaf8b6852bf461&units=metric`;
    var weather_API = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=fd525910006e703a7afaf8b6852bf461&units=metric`;
    request(weather_API, function (error, response, body) {
      console.log('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
      console.log('weather for today is');
      var data = JSON.parse(body); 
      var weather = data.weather;
      console.log(weather[0].main);
      var data = weather[0].main;
      callback(data);
    });
  })
}


var googleCoord = (settings, callback) => {
  var address = encodeURI(settings.userInfo.home_address);
  var google_geo = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyB7IQtJAtVXXQjxn7LqAgjDwlUCR7qkJAw`
    request(google_geo, function (error, response, body) {
      var data = JSON.parse(body); 
      var results = data.results;
      var coordinates = results[0].geometry.location;
      callback(coordinates.lat, coordinates.lng);
    });
}

module.exports = {
  getWeather
};