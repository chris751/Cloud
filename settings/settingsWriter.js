var fs = require('fs');
var _ = require('lodash');

var lightEngine = require('./../engine/lightEngine');

var fetchNotes = () => {
  try {
    var notesString = fs.readFileSync('./settings/userSettings.json');
    return JSON.parse(notesString);
  } catch (e) {
    return [];
  }
};

var fetchSpecificSetting = (id, callback) => {
  var loadedSettings = fetchNotes();
  var index;
  var settings;
  if (loadedSettings.length > 0) {
    for (i = loadedSettings.length - 1; i >= 0; --i) {
      if (loadedSettings[i].userInfo.profile_id == id) {
        index = i;
        settings = true;
      }
    }
    if (settings) {
      console.log('settings found ');
      return callback(loadedSettings[index]);
    } else {
      console.log('no settings found');
      return callback('no settings found');
    }
  } else {
    console.log('no settings found');
    return callback('no settings found');
  }
}


/**
 * Returns all settings from matching value
 *
 * @param attribute value from settings that we are comparing
 * @param value the actual value compared to attribute 
 * 
 */

var getSettingsByAttributes = (attribute, value, callback) => {
  var loadedSettings = fetchNotes();
  if (loadedSettings.length > 0) {
    for (i = loadedSettings.length - 1; i >= 0; --i) {
      if (attribute == 'mac_address' && loadedSettings[i].userInfo.mac_address == value) { //we found the value
          callback(loadedSettings[i]); //return all the settings
      } if (attribute == 'id' && loadedSettings[i].userInfo.id == value) { //we found the value
         callback(loadedSettings[i]); //return all the settings
        }
    }
     callback ('no such setting');
  }
}

var getSettingsFromPriArray = (attribute, value, callback) => {
  var loadedSettings = fetchNotes();
  var array = [];
  if (loadedSettings.length > 0) {
    for (i = loadedSettings.length - 1; i >= 0; --i) {
      for (j = value.length - 1; j >= 0; --j){
        if (attribute == 'mac_address' && loadedSettings[i].userInfo.mac_address == value[j]) { //we found the value
          array.push(loadedSettings[i]);
        }
      }
    }
    callback(array);
  }
}

var writeToDisc = (settings) => {
  fs.writeFileSync('./settings/userSettings.json', JSON.stringify(settings, null, 2));
  console.log(settings);
  lightEngine.checkForChanges(settings);
};

var saveSettings = function (body, callback) {
  var settings = fetchNotes();
  var isHere = false;
  var index;

  if (settings.length > 0) { // settings file is not empty 
    for (i = settings.length - 1; i >= 0; --i) {
      //console.log(i);
      //console.log(settings);
      if (settings[i].userInfo.profile_id !== body.userInfo.profile_id && !isHere) { // a new user is here!
        console.log(' if');
        isHere = false;
      } else if (settings[i].userInfo.profile_id == body.userInfo.profile_id) { // user is already there, but some setting has been changed
        console.log('else if');
        //settings.splice(i, 1); // delete it
        isHere = true;
        index = i;
        //addIt(body, settings, callback); // add it
      }
    }
  }
  if (isHere) {
    console.log('deleting it');
    settings.splice(index, 1); // delete it
    addIt(body, settings, callback); // add it
  } else {
    addIt(body, settings, callback);
  }
}

var addIt = function (body, settings, callback) {
  //console.log('adding it');
  settings.push(body);
  var uniqe = _.uniqBy(settings, 'userInfo.profile_id');
  //console.log(uniqe);
  writeToDisc(uniqe);
  return callback();
}

var getBluetoothData = function (callback) {
  var settings = fetchNotes();
  var bluetoothList = [];
  if (settings.length > 0) { // settings file is not empty 
    for (i = settings.length - 1; i >= 0; --i) {
      if (settings[i].userInfo.mac_address) {
        bluetoothList.push(settings[i].userInfo.mac_address);
      }
    }
  }
  console.log(bluetoothList);
  callback(bluetoothList);
}


module.exports =   { 
  fetchNotes,
  fetchSpecificSetting,
  saveSettings,
  getBluetoothData,
  getSettingsByAttributes,
  getSettingsFromPriArray
};