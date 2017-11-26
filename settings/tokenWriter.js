var fs = require('fs');
var _ = require('lodash');

var saveAuthToFile = function (oauth2Client, id) {
  var tokens = fetchTokens();
  var index;
  var exsistingToken = false;
  var body = {
    id: id,
    token: oauth2Client
  }
  if (tokens.length > 0) { // settings file is not empty 
    for (i = tokens.length - 1; i >= 0; --i) {
      if (tokens[i].id == id) {
        console.log('found id in tokens');
        index = i;
        exsistingToken = true; 

      }
    }
  }
  if (exsistingToken) {
    console.log('already there so im deleting it ');
    tokens.splice(index, 1); // delete it
    console.log('should be empty ');
    console.log(tokens);
    addIt(body, tokens);
  } else {
    console.log('new user!!!');
    addIt(body, tokens);
  }
}


var addIt = function (body, tokens) {
  tokens.push(body);
  console.log(tokens);
  var uniqe = _.uniqBy(tokens, 'id');
  console.log(uniqe);
  saveNotes(uniqe);
}

var fetchTokens = () => {
  try {
    var notesString = fs.readFileSync('./settings/tokens.json');
    return JSON.parse(notesString);
  } catch (e) {
    return [];
  }
};

var saveNotes = (notes) => {
  fs.writeFileSync('./settings/tokens.json', JSON.stringify(notes, null, 2));
  //console.log(notes);
};


var getTokenById = (id, callback) => {
  var token = fetchTokens();
  var resArray = [];
  if (token.length > 0) {
    for (i = token.length - 1; i >= 0; --i) {
      for (j = id.length - 1; j >= 0; --j) {
        if (token[i].id == id[j]) { //we found the value
          console.log('found token from id');
          resArray.push(token[i]);
        } else {
          return callback('no such setting');
        }
      }
    }
    // console.log('token array');
    // console.log(resArray)
    callback(resArray); //return only the tokens
  }
}


module.exports =   { 
  saveAuthToFile,
  getTokenById
};