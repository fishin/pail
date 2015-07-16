var Code = require('code');
var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Path = require('path');
var Pail = require('../lib/index');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var pail = new Pail({ dirPath: __dirname + '/tmp' });
var noexist = new Pail({ dirPath: __dirname + '/noexist' });

describe('pail', function () {

    it('getPails with no valid path', function (done) {

        var pails = noexist.getPails();
        expect(pails).to.have.length(0);
        done();
    });

    it('getPail with no valid path', function (done) {

        var nopail = noexist.getPail('noexist');
        expect(nopail).to.not.exist();
        done();
    });

    it('getPail with null pailId', function (done) {

        var nopail = noexist.getPail(null);
        expect(nopail).to.not.exist();
        done();
    });

    it('getFiles with no valid path', function (done) {

        var files = noexist.getFiles('noexist');
        expect(files.length).to.be.equal(0);
        done();
    });

    it('getPailByName no link', function (done) {

        var pailId = pail.getPailByName('link');
        expect(pailId).to.not.exist();
        done();
    });

    it('createPail with workspace', function (done) {

        var config = { name: 'name', foo: 'bar' };
        var createPail = pail.createPail(config);
        pail.createDir('workspace');
        expect(createPail.name).to.equal('name');
        expect(createPail.foo).to.equal('bar');
        expect(createPail.createTime).to.exist();
        expect(createPail.startTime).to.not.exist();
        expect(createPail.status).to.equal('created');
        done();
    });

    it('createPail with same name', function (done) {

        var config = { name: 'name', foo: 'bar' };
        var createPail = pail.createPail(config);
        pail.createDir('workspace');
        expect(createPail).to.not.exist();
        done();
    });

    it('createPail with existing workspace', function (done) {

        pail.createDir('workspace');
        done();
    });

    it('getPail', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        expect(getPail.foo).to.exist();
        done();
    });

    it('getPailByName', function (done) {

        var pailId = pail.getPailByName('name');
        expect(pailId).to.exist();
        done();
    });

    it('getPails', function (done) {

        var pails = pail.getPails();
        expect(pails).to.have.length(1);
        done();
    });

    it('updatePail starting', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'starting';
        var config = pail.updatePail(getPail);
        expect(config.startTime).to.exist();
        expect(config.finishTime).to.not.exist();
        expect(config.status).to.equal('started');
        done();
    });

    it('updatePail succeeded', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'succeeded';
        getPail.finishTime = null;
        var config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('succeeded');
        var link = pail.getPailByName('lastSuccess');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('updatePail failed', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'failed';
        getPail.finishTime = null;
        var config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('failed');
        var link = pail.getPailByName('lastFail');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('updatePail cancelled', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'cancelled';
        getPail.finishTime = null;
        var config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('cancelled');
        var link = pail.getPailByName('lastCancel');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('getLinks', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        var links = pail.getLinks(getPail.id);
        expect(links).to.have.length(5);
        done();
    });

    it('updatePail rename', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.name = 'newname';
        var config = pail.updatePail(getPail);
        expect(config.name).to.equal('newname');
        expect(config.updateTime).to.exist();
        done();
    });

    it('deletePail with workspace', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        pail.deleteDir('workspace');
        pail.deletePail(getPail.id);
        var links = pail.getLinks(getPail.id);
        expect(links).to.have.length(0);
        var deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteWorkspace with files and dirs', function (done) {

        var config = { foo: 'bar' };
        var createPail = pail.createPail(config);
        pail.createDir('workspace');
        var tmpDir = Path.join(pail.settings.dirPath, 'workspace', 'tmp');
        var tmpFile = 'tmpFile';
        Fs.mkdirSync(tmpDir);
        Fs.writeFileSync(tmpDir + '/' + tmpFile, 'foo');
        var pails = pail.getPails(pail.settings.dirPath + '/' + createPail.id);
        expect(pails).to.have.length(1);
        var files = pail.getFiles('workspace');
        expect(files.length).to.be.equal(0);
        pail.deleteDir('workspace');
        pail.deletePail(createPail.id);
        var deletePails = pail.getPails(pail.settings.dirPath);
        expect(deletePails).to.have.length(0);
        done();
    });

    it('getArtifact with workspace', function (done) {

        var fileName = 'blah.json';
        var blah = {
            foo: 'bar'
        };
        var workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        var contents = JSON.parse(pail.getArtifact('workspace', fileName));
        expect(contents.foo).to.equal('bar');
        pail.deleteDir('workspace');
        done();
    });

    it('copyArtifact null', function (done) {

        pail.copyArtifact('workspace', 'archive', null);
        // maybe check it doesnt throw an error?
        done();
    });

    it('copyArtifact noexist', function (done) {

        var fileName = 'blah.json';
        var blah = {
            foo: 'bar'
        };
        var workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        var contents = JSON.parse(pail.getArtifact('workspace', fileName));
        pail.copyArtifact('workspace', 'archive', fileName);
        var archive = JSON.parse(pail.getArtifact('archive', fileName));
        expect(archive).to.not.exist();
        pail.deleteDir('workspace');
        done();
    });

    it('copyArtifact', function (done) {

        var fileName = 'blah.json';
        var blah = {
            foo: 'bar'
        };
        var workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        pail.createDir('archive');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        var contents = JSON.parse(pail.getArtifact('workspace', fileName));
        pail.copyArtifact('workspace', 'archive', fileName);
        var archive = JSON.parse(pail.getArtifact('archive', fileName));
        expect(contents.foo).to.equal('bar');
        expect(archive.foo).to.equal('bar');
        pail.deleteDir('workspace');
        done();
    });

    it('getFiles', function (done) {

        var fileName = 'blah.json';
        var files = pail.getFiles('archive');
        pail.deleteDir('archive');
        expect(files[0]).to.equal(fileName);
        done();
    });

    it('createPail noname', function (done) {

        var config = { foo: 'bar' };
        var createPail = pail.createPail(config);
        expect(createPail.foo).to.equal('bar');
        expect(config.createTime).to.exist();
        expect(config.startTime).to.not.exist();
        expect(config.status).to.equal('created');
        done();
    });

    it('deleteWorkspace with no workspace noname', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        pail.deleteDir('workspace');
        done();
    });

    it('getArtifact no workspace', function (done) {

        var fileName = 'blah.json';
        var contents = pail.getArtifact('workspace', fileName);
        expect(contents).to.not.exist();
        done();
    });

    it('updatePail noname starting', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'starting';
        var config = pail.updatePail(getPail);
        expect(config.startTime).to.exist();
        expect(config.finishTime).to.not.exist();
        expect(config.status).to.equal('started');
        done();
    });

    it('deletePail noname', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        pail.deletePail(getPail.id);
        var deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteName', function (done) {

        var config1 = { name: 'pail1', foo: 'bar' };
        var config2 = { name: 'pail2', foo: 'bar' };
        var createPail1 = pail.createPail(config1);
        var createPail2 = pail.createPail(config2);
        pail.createName(createPail1.id, 'link');
        pail.createName(createPail2.id, 'link');
        var link = pail.getPailByName('link');
        expect(link).to.equal(createPail2.id);
        pail.deleteName('link');
        pail.deletePail(createPail1.id);
        pail.deletePail(createPail2.id);
        var deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });
});
