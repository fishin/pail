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
    this.updatePail = exports.updatePail;
    this.getPail = exports.getPail;
    this.getPails = exports.getPails;
    this.deletePail = exports.deletePail;
    this.createLink = exports.createLink;
    this.deleteLink = exports.deleteLink;
    this.getLinks = exports.getLinks;
    this.getPailByLink = exports.getPailByLink;
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
   var configFile = dirpath + '/' + this.settings.configFile;
   config.status = 'created';
   config.createTime = new Date().getTime();
   Fs.writeFileSync(configFile, JSON.stringify(config,null,4));
   if (config.name) {
       Fs.symlinkSync(dirpath, this.settings.dirpath + '/' + config.name);
   }
   return config;
};

exports.updatePail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   var dirpath = this.settings.dirpath + '/' + config.id;
   if (config.name) {
       var origConfig = this.getPail(config.id);
       if (origConfig.name !== config.name) {
           Fs.unlinkSync(this.settings.dirpath + '/' + origConfig.name);
           //Fs.symlinkSync(dirpath, this.settings.dirpath + '/' + config.name);
           this.createLink(config.id, config.name);
       }
   }
   var configFile = dirpath + '/' + this.settings.configFile;
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled') {

       config.finishTime = new Date().getTime();
       this.createLink(config.id, 'last');
   }
   if (config.status === 'succeeded') {
       this.createLink(config.id, 'lastSuccess');
   }
   if (config.status === 'failed') {
       this.createLink(config.id, 'lastFail');
   }
   if (config.status === 'cancelled') {
       this.createLink(config.id, 'lastCancel');
   }
   if (config.status === 'starting') {
       config.startTime = new Date().getTime();
       config.status = 'started';
   }
   config.updateTime = new Date().getTime();
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
   var links = this.getLinks(pail_id);
   for (var i = 0; i < links.length; i++) {
       this.deleteLink(links[i]);
   }
   internals.deleteDir(dirpath);
};

exports.createLink = function(pail_id, name) {

   var dirpath = this.settings.dirpath + '/' + pail_id;
   var link;
   try {
      link = Fs.readlinkSync(this.settings.dirpath + '/' + name);
   } 
   catch (err) {
      // dont care
   }
   if (link) {
      this.deleteLink(name);
   }
   Fs.symlinkSync(dirpath, this.settings.dirpath + '/' + name);
}

exports.deleteLink = function(name) {

    Fs.unlinkSync(this.settings.dirpath + '/' + name);
}

exports.getLinks = function(pail_id) {

    var dir = this.settings.dirpath;
    var list = Fs.readdirSync(dir);
    var links = [];
    for(var i = 0; i < list.length; i++) {
      
        var filename = Path.join(dir, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isSymbolicLink()) {
            var path = Fs.readlinkSync(filename);
            if (path.match(pail_id)) {
                //console.log('matched: ' + list[i]);
                links.push(list[i]);
            }
        }
    }
    return links;
}

exports.getPailByLink = function(link) {

   var dirpath = Fs.readlinkSync(this.settings.dirpath + '/' + link);
   var pail = dirpath.split('/');
   var pail_id = pail[pail.length-1];
   return pail_id;
}
