var fs = require('fs');

  var fetchNotes = () => {
    try {
      var notesString = fs.readFileSync('./settings/userSettings.json');
      return JSON.parse(notesString);
    } catch (e) {
      return [];
    }
  };

  var saveNotes = (notes) => {
    fs.writeFileSync('./settings/userSettings.json', JSON.stringify(notes));
  };

  exports.addNote = function (body, callback) {
    var duplicateNotes;
    var settings = fetchNotes();

    if (settings.length > 0) { // settings file is not empty 
      for (i = settings.length - 1; i >= 0; --i) {
        if (settings[i].profile_id !== body.profile_id) { // a new user is here!
          addIt(body, settings, callback); 
        } else if (settings[i].profile_id == body.profile_id) { // user is already there, but some setting has been changed
          settings.splice(i, 1); // delete it
          addIt(body, settings, callback); // add it
        }
      }
    } else { // settings file is empty
      addIt(body, settings, callback);
    }
  }

  var addIt = function (body, settings, callback) {
    console.log('adding it');
    settings.push(body);
    saveNotes(settings);
    callback();
  }
