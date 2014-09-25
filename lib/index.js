var Fs = require('fs');
var Path = require('path');
var Uuid = require('node-uuid');
var Hoek = require('hoek');

var internals = {
    defaults: {
        configFile: 'config.json', 
        workspace: 'workspace',
        dirpath: '/tmp/pail'
    }
};

module.exports = internals.Pail = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    this.settings = settings;
    this.createWorkspace = exports.createWorkspace;
    this.deleteWorkspace = exports.deleteWorkspace;
    this.createPail = exports.createPail;
    this.savePail = exports.savePail;
    this.getPail = exports.getPail;
    this.getPails = exports.getPails;
    this.deletePail = exports.deletePail;
    this.getPailByName = exports.getPailByName;
};

exports.deleteWorkspace = function(pail_id) {

    var dir = this.settings.dirpath + '/' + pail_id + '/' + this.settings.workspace;
    internals.deleteDir(dir);
};

internals.deleteDir = function(dir) {

    var list = Fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
      
        var filename = Path.join(dir, list[i]);
        var stat = Fs.lstatSync(filename);
//        if (filename == "." || filename == "..") {
            // pass these files
//        }
//        else if (stat.isDirectory()) {
        if (stat.isDirectory()) {
             
            // rmdir recursively
            internals.deleteDir(filename);
        }
        else {
           // rm filename
           //if (filename.match('^/tmp/node-ci')) {
               Fs.unlinkSync(filename);
           //}
        }
    }
    //if (dir.match('^/tmp/node-ci')) {
        Fs.rmdirSync(dir);
    //}
};

exports.createWorkspace = function(pail_id) {

    var dir = this.settings.dirpath + '/' + pail_id + '/' + this.settings.workspace;
    Fs.mkdirSync(dir);
}

internals.mkdirp = function (dirpath) {
  
  var parts = dirpath.split('/');
  for ( var i = 2; i <= parts.length; i++ ) {

    var dir = parts.slice(0, i).join('/');
    if ( ! Fs.existsSync(dir) ) {
       
            //console.log('making dir: ' + dir);
        	Fs.mkdirSync ( dir );
    }
  }
}

internals.getDirs = function (dirpath) {

    var list = [];
    if (Fs.existsSync(dirpath)) {
        list = Fs.readdirSync(dirpath);
    }
    var dirs = [];
    for(var i = 0; i < list.length; i++) {

        var filename = Path.join(dirpath, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isDirectory()) {
            var path = filename.split('/');
	    var dir = path[path.length-1];
            dirs.push(dir);
        }
/*
        else {
           // skip because its a file
        }
*/
    }
    return dirs;
};

exports.getPails = function () {

    var pails = internals.getDirs(this.settings.dirpath);
    return pails;
};

exports.createPail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   config.id = Uuid.v4();
   var dirpath = this.settings.dirpath + '/' + config.id;
   internals.mkdirp(dirpath);
   this.createWorkspace(config.id);
   var configFile = dirpath + '/' + this.settings.configFile;
   config.status = 'created';
   config.createTime = new Date().getTime();
   Fs.writeFileSync(configFile, JSON.stringify(config,null,4));
   if (config.name) {
       Fs.symlinkSync(dirpath, this.settings.dirpath + '/' + config.name);
   }
   return config;
};

exports.savePail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   var dirpath = this.settings.dirpath + '/' + config.id;
   if (config.name) {
       var origConfig = this.getPail(config.id);
       if (origConfig.name !== config.name) {
           Fs.unlinkSync(this.settings.dirpath + '/' + origConfig.name);
           Fs.symlinkSync(dirpath, this.settings.dirpath + '/' + config.name);
       }
   }
   var configFile = dirpath + '/' + this.settings.configFile;
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled') {
       config.finishTime = new Date().getTime();
   }
   if (config.status === 'starting') {
       config.startTime = new Date().getTime();
       config.status = 'started';
   }
   Fs.writeFileSync(configFile, JSON.stringify(config,null,4));
   return config;
};

exports.getPail = function (pail_id) {

   var dirpath = this.settings.dirpath + '/' + pail_id;
   var configFile = dirpath + '/' + this.settings.configFile;
   var config = Fs.readFileSync(configFile, "utf8");
   return JSON.parse(config);
};

exports.deletePail = function (pail_id) {

   var dirpath = this.settings.dirpath + '/' + pail_id;
   var origConfig = this.getPail(pail_id);
   var configFile = dirpath + '/' + this.settings.configFile;
   Fs.unlinkSync(configFile);
   this.deleteWorkspace(pail_id);
   if (origConfig.name) {
       Fs.unlinkSync(this.settings.dirpath + '/' + origConfig.name);
   }
   Fs.rmdirSync(dirpath);
};

exports.getPailByName = function(name) {

   var dirpath = Fs.readlinkSync(this.settings.dirpath + '/' + name);
   var pail = dirpath.split('/');
   var pail_id = pail[pail.length-1];
   return pail_id;
}
