var Fs = require('fs');
var Path = require('path');
var Uuid = require('node-uuid');
var Hoek = require('hoek');

var internals = {
    defaults: {
        configFile: 'config.json',
        dirPath: '/tmp/pail'
    }
};

module.exports = function (options) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);
    this.settings = settings;
    this.createDir = exports.createDir;
    this.deleteDir = exports.deleteDir;
    this.getArtifact = exports.getArtifact;
    this.copyArtifact = exports.copyArtifact;
    this.createPail = exports.createPail;
    this.updatePail = exports.updatePail;
    this.getPail = exports.getPail;
    this.getPails = exports.getPails;
    this.deletePail = exports.deletePail;
    this.createName = exports.createName;
    this.deleteName = exports.deleteName;
    this.getLinks = exports.getLinks;
    this.getPailByName = exports.getPailByName;
    this.getFiles = exports.getFiles;
};

exports.deleteDir = function(dir) {

    var deleteDir = Path.join(this.settings.dirPath, dir);
    internals.rmrf(deleteDir);
};

exports.getArtifact = function(dir, artifact) {

    var artifactFile = Path.join(this.settings.dirPath, dir, artifact);
    var contents = null;
    try {
        contents = Fs.readFileSync(artifactFile, 'utf8');
    }
    catch (err) {
       // do nothing
    }
    return contents;
};

exports.copyArtifact = function (sourceDir, targetDir, artifact) {

    if (artifact) {
        var artifactFile = Path.join(this.settings.dirPath, sourceDir, artifact);
        var archiveFile = Path.join(this.settings.dirPath, targetDir, artifact);
        var contents = this.getArtifact(sourceDir, artifact);
        try {
            Fs.writeFileSync(archiveFile, contents);
        }
        catch (err) {
            //console.log(err);
        }
    }
};

internals.rmrf = function(dir) {

    var list = null;
    try {
        list = Fs.readdirSync(dir);
    }
    catch (err) {
        //console.log(err);
    }
    if (list) {
        for (var i = 0; i < list.length; i++) {
            var filename = Path.join(dir, list[i]);
            var stat = Fs.lstatSync(filename);
            if (stat.isDirectory()) {
                // rmdir recursively
                internals.rmrf(filename);
            }
            else {
               // rm filename
               Fs.unlinkSync(filename);
            }
        }
        Fs.rmdirSync(dir);
    }
};

exports.createDir = function(dir) {

    var createDir = Path.join(this.settings.dirPath, dir);
    try {
        Fs.mkdirSync(createDir);
    }
    catch (err) {
        //console.log(err);
    }
};

internals.mkdirp = function (dirPath) {

  var parts = dirPath.split('/');
  for ( var i = 2; i <= parts.length; i++ ) {

    var dir = parts.slice(0, i).join('/');
    try {
        //console.log('making dir: ' + dir);
        Fs.mkdirSync(dir);
    }
    catch (err) {
        //console.log(err);
    }
  }
};

internals.getGuids = function (dirPath) {

    var list = [];
    try {
        list = Fs.readdirSync(dirPath);
    }
    catch (err) {
        //console.log(err);
    }
    var dirs = [];
    for (var i = 0; i < list.length; i++) {

        var filename = Path.join(dirPath, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isDirectory()) {
            var path = filename.split('/');
            var dir = path[path.length - 1];
            // if it matches a guid, then show it
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(dir)) {
               dirs.push(dir);
            }
        }
    }
    return dirs;
};

exports.getFiles = function (dir) {

    var dirPath = Path.join(this.settings.dirPath, dir);
    var list = [];
    try {
        list = Fs.readdirSync(dirPath);
    }
    catch (err) {
        //console.log(err);
    }
    var files = [];
    for (var i = 0; i < list.length; i++) {
        var filename = Path.join(dirPath, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isFile()) {
            var path = filename.split('/');
            var file = path[path.length - 1];
            files.push(file);
        }
    }
    return files;
};

exports.getPails = function () {

    var pails = internals.getGuids(this.settings.dirPath);
    return pails;
};

exports.createPail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   if (config.name) {
       if (Fs.existsSync(Path.join(this.settings.dirPath, config.name))) {
           console.log(config.name + ' already exists');
           return null;
       }
   }
   config.id = Uuid.v4();
   var dirPath = Path.join(this.settings.dirPath, config.id);
   internals.mkdirp(dirPath);
   var configFile = Path.join(dirPath, this.settings.configFile);
   config.status = 'created';
   config.createTime = new Date().getTime();
   Fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
   if (config.name) {
       //Fs.symlinkSync(config.id, Path.join(this.settings.dirPath, config.name));
       this.createName(config.id, config.name);
   }
   return config;
};

exports.updatePail = function (config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   var dirPath = Path.join(this.settings.dirPath, config.id);
   if (config.name) {
       var origConfig = this.getPail(config.id);
       if (origConfig.name !== config.name) {
           Fs.unlinkSync(Path.join(this.settings.dirPath, origConfig.name));
           //Fs.symlinkSync(dirPath, Path.join(this.settings.dirPath, config.name));
           this.createName(config.id, config.name);
       }
   }
   var configFile = Path.join(dirPath, this.settings.configFile);
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled') {

       config.finishTime = new Date().getTime();
       this.createName(config.id, 'last');
   }
   if (config.status === 'succeeded') {
       this.createName(config.id, 'lastSuccess');
   }
   if (config.status === 'failed') {
       this.createName(config.id, 'lastFail');
   }
   if (config.status === 'cancelled') {
       this.createName(config.id, 'lastCancel');
   }
   if (config.status === 'starting') {
       config.startTime = new Date().getTime();
       config.status = 'started';
   }
   config.updateTime = new Date().getTime();
   Fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
   return config;
};

exports.getPail = function (pailId) {

   var config = null;
   if (pailId) {
       var dirPath = Path.join(this.settings.dirPath, pailId);
       var configFile = Path.join(dirPath, this.settings.configFile);
       try {
           config = JSON.parse(Fs.readFileSync(configFile, 'utf8'));
       }
       catch (err) {
           //console.log(err);
       }
   }
   return config;
};

exports.deletePail = function (pailId) {

   var dirPath = Path.join(this.settings.dirPath, pailId);
   var links = this.getLinks(pailId);
   for (var i = 0; i < links.length; i++) {
       this.deleteName(links[i]);
   }
   internals.rmrf(dirPath);
};

exports.createName = function(pailId, name) {

   //var dirPath = Path.join(this.settings.dirPath, pailId);
   var link;
   try {
      link = Fs.readlinkSync(Path.join(this.settings.dirPath, name));
   }
   catch (err) {
      // dont care
   }
   if (link) {
      this.deleteName(name);
   }
   Fs.symlinkSync(pailId, Path.join(this.settings.dirPath, name));
};

exports.deleteName = function(name) {

    Fs.unlinkSync(Path.join(this.settings.dirPath, name));
};

exports.getLinks = function(pailId) {

    var dir = this.settings.dirPath;
    var list = Fs.readdirSync(dir);
    var links = [];
    for (var i = 0; i < list.length; i++) {
        var filename = Path.join(dir, list[i]);
        var stat = Fs.lstatSync(filename);
        if (stat.isSymbolicLink()) {
            var path = Fs.readlinkSync(filename);
            if (path.match(pailId)) {
                //console.log('matched: ' + list[i]);
                links.push(list[i]);
            }
        }
    }
    return links;
};

exports.getPailByName = function(name) {

   var linkPath = Path.join(this.settings.dirPath, name);
   var dirPath = null;
   try {
       dirPath = Fs.readlinkSync(linkPath);
   }
   catch (err) {
       dirPath = null;
   }
   finally {
       if (dirPath) {
           var pail = dirPath.split('/');
           var pailId = pail[pail.length - 1];
           return pailId;
       }
       return dirPath;
   }
};
