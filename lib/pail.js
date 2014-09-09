var Fs = require('fs');
var Path = require('path');
var Uuid = require('node-uuid');

var internals = {
    defaults: {
        pailFile: 'config.json', 
        workspace: 'workspace'
    }
};

internals.deleteWorkspace = function(dir) {

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
            internals.deleteWorkspace(filename);
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

internals.createWorkspace = function(dir) {

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

    var list = Fs.readdirSync(dirpath);
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

exports.getPails = function (path) {

    var pailPath = path;
    var pails = this.getDirs(pailPath);
    return pails;
};

exports.savePail = function (path, config) {

   //console.log('saving with config: ' + JSON.stringify(config));
   var pailPath = null;
   if (!config.id) {
       config.id = Uuid.v4();
       // override pailPath again if its new
       pailPath = path + '/' + config.id;
       internals.mkdirp(pailPath);
       internals.createWorkspace(path + '/' + config.id + '/' + internals.defaults.workspace);
   }
   else {
       pailPath = path + '/' + config.id;
   }

   var pailFile = pailPath + '/' + internals.defaults.pailFile;
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
   Fs.writeFileSync(pailFile, JSON.stringify(config,null,4));
   return config;
};

exports.getPail = function (path, pail_id) {

   var pailPath = path + '/' + pail_id;
   var pailFile = pailPath + '/' + internals.defaults.pailFile;
   var config = Fs.readFileSync(pailFile, "utf8");
   return JSON.parse(config);
};

exports.deletePail = function (path, pail_id) {

   var pailPath = path + '/' + pail_id;
   var pailFile = pailPath + '/' + internals.defaults.pailFile;
   Fs.unlinkSync(pailFile);
   internals.deleteWorkspace(pailPath + '/' + internals.defaults.workspace);
   Fs.rmdirSync(pailPath);
};

exports.linkPail = function(path, pail_id, name) {

   var pailPath = path + '/' + pail_id;
   Fs.symlinkSync(pailPath, path + '/' + name);
}

exports.getPailByName = function(path, name) {

   var pailPath = Fs.readlinkSync(path + '/' + name);
   var pail = pailPath.split('/');
   var pail_id = pail[pail.length-1];
   return pail_id;
}

exports.unlinkPail = function(path, name) {

   Fs.unlinkSync(path + '/' + name);
}
