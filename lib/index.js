var Fs = require('fs');
var Path = require('path');
var Uuid = require('node-uuid');
var Hoek = require('hoek');

var internals = {
    defaults: {
        configFile: 'config.json', 
        workspace: 'workspace',
        pailPath: '/tmp/pail'
    }
};

module.exports = internals.Pail = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    this.settings = settings;
    this.createWorkspace = exports.createWorkspace;
    this.deleteWorkspace = exports.deleteWorkspace;
    this.savePail = exports.savePail;
    this.getPail = exports.getPail;
    this.getPails = exports.getPails;
    this.deletePail = exports.deletePail;
    this.getPailByName = exports.getPailByName;
    this.linkPail = exports.linkPail;
    this.unlinkPail = exports.unlinkPail;
    this.getDirs = exports.getDirs;
};

exports.deleteWorkspace = function(dir) {

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
            this.deleteWorkspace(filename);
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

exports.createWorkspace = function(dir) {

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

exports.getDirs = function (dirpath) {

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

    var pails = this.getDirs(this.settings.pailPath);
    return pails;
};

exports.savePail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   var pailPath = null;
   if (!config.pail_id) {
       config.pail_id = Uuid.v4();
       // override pailPath again if its new
       pailPath = this.settings.pailPath + '/' + config.pail_id;
       internals.mkdirp(pailPath);
       this.createWorkspace(pailPath + '/' + this.settings.workspace);
   }
   else {
       pailPath = this.settings.pailPath + '/' + config.pail_id;
   }

   var configFile = pailPath + '/' + this.settings.configFile;
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled') {
       config.finishTime = new Date().getTime();
   }
   else if (config.status === 'starting') {
       config.startTime = new Date().getTime();
       config.status = 'started';
   }
   else if (config.status === 'created') {
       config.createTime = new Date().getTime();
   }
   Fs.writeFileSync(configFile, JSON.stringify(config,null,4));
   return config;
};

exports.getPail = function (pail_id) {

   var pailPath = this.settings.pailPath + '/' + pail_id;
   var configFile = pailPath + '/' + this.settings.configFile;
   var config = Fs.readFileSync(configFile, "utf8");
   return JSON.parse(config);
};

exports.deletePail = function (pail_id) {

   var pailPath = this.settings.pailPath + '/' + pail_id;
   var configFile = pailPath + '/' + this.settings.configFile;
   Fs.unlinkSync(configFile);
   this.deleteWorkspace(pailPath + '/' + this.settings.workspace);
   Fs.rmdirSync(pailPath);
};

exports.linkPail = function(pail_id, name) {

   var pailPath = this.settings.pailPath + '/' + pail_id;
   Fs.symlinkSync(pailPath, this.settings.pailPath + '/' + name);
}

exports.getPailByName = function(name) {

   var pailPath = Fs.readlinkSync(this.settings.pailPath + '/' + name);
   var pail = pailPath.split('/');
   var pail_id = pail[pail.length-1];
   return pail_id;
}

exports.unlinkPail = function(name) {

   Fs.unlinkSync(this.settings.pailPath + '/' + name);
}
