var hbs = require('hbs');

function hbsHelpers(hbs) {
    return hbs.create({
        helpers: { 
            list: function (arg) { // 'list is the name of the helper function'
                console.log('method called with : ' + arg);
                return arg;
            }
            // More helpers...
        }
    });
}

module.exports = hbsHelpers;