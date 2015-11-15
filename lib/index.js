'use strict';

const Fs = require('fs');
const Path = require('path');
const Uuid = require('node-uuid');
const Hoek = require('hoek');

const internals = {
    defaults: {
        configFile: 'config.json',
        dirPath: '/tmp/pail'
    }
};

module.exports = function (options) {

    const settings = Hoek.applyToDefaults(internals.defaults, options);
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

/**
 * delete a directory
 * @param {string} dir - relative directory to delete
 */
exports.deleteDir = function (dir) {

    const deleteDir = Path.join(this.settings.dirPath, dir);
    internals.rmrf(deleteDir);
};

/**
 * get contents of an artifact
 * @param {string} dir - relative directory where its stored
 * @param {string} artifact - artifact
 * @returns {string} contents - contents of artifact
 */
exports.getArtifact = function (dir, artifact) {

    const artifactFile = Path.join(this.settings.dirPath, dir, artifact);
    let contents = null;
    try {
        contents = Fs.readFileSync(artifactFile, 'utf8');
    }
    catch (err) {
       // do nothing
    }
    return contents;
};

/**
 * copy an artifact
 * @param {string} sourceDir - relative source directory
 * @param {string} targetDir - relative target directory
 * @param {string} artifact - artifact you want to copy
 */
exports.copyArtifact = function (sourceDir, targetDir, artifact) {

    if (artifact) {
        const archiveFile = Path.join(this.settings.dirPath, targetDir, artifact);
        const contents = this.getArtifact(sourceDir, artifact);
        try {
            Fs.writeFileSync(archiveFile, contents);
        }
        catch (err) {
            //console.log(err);
        }
    }
};

internals.rmrf = function (dir) {

    let list = null;
    try {
        list = Fs.readdirSync(dir);
    }
    catch (err) {
        //console.log(err);
    }
    if (list) {
        for (let i = 0; i < list.length; ++i) {
            const filename = Path.join(dir, list[i]);
            const stat = Fs.lstatSync(filename);
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

/**
 * create a directory
 * @param {string} dir - relative directory to create
 */
exports.createDir = function (dir) {

    const createDir = Path.join(this.settings.dirPath, dir);
    try {
        Fs.mkdirSync(createDir);
    }
    catch (err) {
        //console.log(err);
    }
};

internals.mkdirp = function (dirPath) {

    const parts = dirPath.split('/');
    for (let i = 2; i <= parts.length; ++i) {

        const dir = parts.slice(0, i).join('/');
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

    let list = [];
    try {
        list = Fs.readdirSync(dirPath);
    }
    catch (err) {
        //console.log(err);
    }
    const dirs = [];
    for (let i = 0; i < list.length; ++i) {
        const filename = Path.join(dirPath, list[i]);
        const stat = Fs.lstatSync(filename);
        if (stat.isDirectory()) {
            const path = filename.split('/');
            const dir = path[path.length - 1];
            // if it matches a guid, then show it
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(dir)) {
                dirs.push(dir);
            }
        }
    }
    return dirs;
};

/**
 * get files
 * @param {string} dir - get all filenames in the relative directory
 * @returns {Array} files
 */
exports.getFiles = function (dir) {

    const dirPath = Path.join(this.settings.dirPath, dir);
    let list = [];
    try {
        list = Fs.readdirSync(dirPath);
    }
    catch (err) {
        //console.log(err);
    }
    const files = [];
    for (let i = 0; i < list.length; ++i) {
        const filename = Path.join(dirPath, list[i]);
        const stat = Fs.lstatSync(filename);
        if (stat.isFile()) {
            const path = filename.split('/');
            const file = path[path.length - 1];
            files.push(file);
        }
    }
    return files;
};

/**
 * get pails
 * @returns {Array} pails - get all pailIds
 */
exports.getPails = function () {

    const pails = internals.getGuids(this.settings.dirPath);
    return pails;
};

/**
 * create pail
 * @param {object} config - create a pail from a given config object
 * @returns {object} config - return object with updates
 */
exports.createPail = function (config) {

    //console.log('saving with config: ' + JSON.stringify(config));
    if (config.name) {
        if (Fs.existsSync(Path.join(this.settings.dirPath, config.name))) {
            console.log(config.name + ' already exists');
            return null;
        }
    }
    config.id = Uuid.v4();
    const dirPath = Path.join(this.settings.dirPath, config.id);
    internals.mkdirp(dirPath);
    const configFile = Path.join(dirPath, this.settings.configFile);
    config.status = 'created';
    config.createTime = new Date().getTime();
    Fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
    if (config.name) {
        //Fs.symlinkSync(config.id, Path.join(this.settings.dirPath, config.name));
        this.createName(config.id, config.name);
    }
    return config;
};

/**
 * update pail
 * @param {object} config - update a pail from a given config object
 * @returns {object} config - return object with updates
 */
exports.updatePail = function (config) {

    //console.log('saving with config: ' + JSON.stringify(config));
    const dirPath = Path.join(this.settings.dirPath, config.id);
    if (config.name) {
        const origConfig = this.getPail(config.id);
        if (origConfig.name !== config.name) {
            Fs.unlinkSync(Path.join(this.settings.dirPath, origConfig.name));
            //Fs.symlinkSync(dirPath, Path.join(this.settings.dirPath, config.name));
            this.createName(config.id, config.name);
        }
    }
    const configFile = Path.join(dirPath, this.settings.configFile);
    if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled' || config.status === 'fixed') {
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

/**
 * get pail
 * @param {String} pailId
 * @returns {object} config - return object with specified pailId
 */
exports.getPail = function (pailId) {

    let config = null;
    if (pailId) {
        const dirPath = Path.join(this.settings.dirPath, pailId);
        const configFile = Path.join(dirPath, this.settings.configFile);
        try {
            config = JSON.parse(Fs.readFileSync(configFile, 'utf8'));
        }
        catch (err) {
            //console.log(err);
        }
    }
    return config;
};

/**
 * delete pail
 * @param {String} pailId - deletes pail
 */
exports.deletePail = function (pailId) {

    const dirPath = Path.join(this.settings.dirPath, pailId);
    const links = this.getLinks(pailId);
    for (let i = 0; i < links.length; ++i) {
        this.deleteName(links[i]);
    }
    internals.rmrf(dirPath);
};

/**
 * create name
 * @param {String} pailId - id
 * @param {String} name - name you want to create
 */
exports.createName = function (pailId, name) {

    let link;
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

/**
 * delete name
 * @param {String} name - name you want to delete
 */
exports.deleteName = function (name) {

    Fs.unlinkSync(Path.join(this.settings.dirPath, name));
};

/**
 * get links
 * @param {String} pailId - get all the names for a given id
 * @returns {Array} names
 */
exports.getLinks = function (pailId) {

    const dir = this.settings.dirPath;
    const list = Fs.readdirSync(dir);
    const links = [];
    for (let i = 0; i < list.length; ++i) {
        const filename = Path.join(dir, list[i]);
        const stat = Fs.lstatSync(filename);
        if (stat.isSymbolicLink()) {
            const path = Fs.readlinkSync(filename);
            if (path.match(pailId)) {
                //console.log('matched: ' + list[i]);
                links.push(list[i]);
            }
        }
    }
    return links;
};

/**
 * get pail by name
 * @param {String} name - get pail from name
 * @returns {object} pail
 */
exports.getPailByName = function (name) {

    const linkPath = Path.join(this.settings.dirPath, name);
    let dirPath = null;
    try {
        dirPath = Fs.readlinkSync(linkPath);
    }
    catch (err) {
        dirPath = null;
    }
    finally {
        if (dirPath) {
            const pail = dirPath.split('/');
            const pailId = pail[pail.length - 1];
            return pailId;
        }
        return dirPath;
    }
};
