var hbs = require('hbs');
var settingsHelper = require('./../settings/settingsWriter');

function hbsHelpers(hbs) {
    return hbs.create({
        helpers: { 
            getValue: function (arg) { // 'list is the name of the helper function'
                res = settingsHelper.getRequestedSetting(arg)
                return res; 
            }
            // More helpers...
        }
    });
}
module.exports = hbsHelpers;