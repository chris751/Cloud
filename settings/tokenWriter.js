var fs = require('fs');
var _ = require('lodash');

var saveAuthToFile = function (oauth2Client, id){
  var tokens = fetchTokens();
  var index;
  var body = { 
    id : id, 
    token : oauth2Client
  }
  if (tokens.length > 0) { // settings file is not empty 
    for (i = tokens.length - 1; i >= 0; --i) {
      if (tokens[i].id == id) {
        index = i;
      }
    }
  }
  if (index){
    tokens.splice(index, 1); // delete it
    addIt(body, tokens);
  }else {
    addIt(body, tokens);
  }
}


var addIt = function (body, tokens) {
tokens.push(body);
var uniqe = _.uniqBy(tokens, 'id');
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
  if (token.length > 0) {
    for (i = token.length - 1; i >= 0; --i) {
      if (token[i].id == id) { //we found the value
         callback(token[i].token); //return only the tokens
      } else {
        return callback('no such setting');
      }
    }
  }
}


module.exports =   { 
  saveAuthToFile,
  getTokenById
};