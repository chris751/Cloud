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
  if (loadedSettings.length > 0) { 
    for (i = loadedSettings.length - 1; i >= 0; --i) {
      if (loadedSettings[i].profile_id == id) {
          return callback(loadedSettings[i]);
      }
    }
  }
}

var getRequestedSetting = (setting, callback) => {
  var loadedSettings = fetchNotes();
  console.log('called with' + setting);

  if (loadedSettings.length > 0) { 
    for (i = loadedSettings.length - 1; i >= 0; --i) {
      if (setting == 'event_name') {
        console.log('in here');
        return 'loadedSettings[i].cal_event';
      }
    }
  }
}

var saveNotes = (notes) => {
  fs.writeFileSync('./settings/userSettings.json', JSON.stringify(notes, null, 2));
  console.log(notes);
  lightEngine.start(notes);
};

var addNote = function (body, callback) {
  var duplicateNotes;
  var settings = fetchNotes();

  if (settings.length > 0) { // settings file is not empty 
    for (i = settings.length - 1; i >= 0; --i) {
      //console.log(i);
      //console.log(settings);
      if (settings[i].profile_id !== body.profile_id) { // a new user is here!
        //console.log(' if');
        addIt(body, settings, callback);


      } else if (settings[i].profile_id == body.profile_id) { // user is already there, but some setting has been changed
        //console.log('else if');
        settings.splice(i, 1); // delete it
        addIt(body, settings, callback); // add it

      }
    }
  } else { // settings file is empty
    //console.log('else');
    addIt(body, settings, callback);
  }
}

var addIt = function (body, settings, callback) {
  console.log('adding it');
  settings.push(body);
  var uniqe = _.uniqBy(settings, 'profile_id');
  //console.log(uniqe);
  saveNotes(uniqe);
  return callback();
}


module.exports =   { 
  fetchNotes,
  fetchSpecificSetting,
  getRequestedSetting,
  addNote
};