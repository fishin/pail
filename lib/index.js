var Hapi = require('hapi');
var Hoek = require('hoek');
var Joi = require('joi');
var Pail = require('./pail');

var internals = {
    defaults: {
        pail: {
            basePath: '/tmp/pail'
        }
    }
};

exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);

    plugin.expose({ getPail: Pail.getPail });
    plugin.expose({ deletePail: Pail.deletePail });
    plugin.expose({ savePail: Pail.savePail });
    plugin.expose({ getDirs: Pail.getDirs });
    next();
};

exports.register.attributes = {

    pkg: require('../package.json')
};
