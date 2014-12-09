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

var pail = new Pail({ dirpath: '/tmp/testpail', workspace: 'workspace'});
var noexist = new Pail({ dirpath: '/tmp/noexist', workspace: 'workspace'});

describe('pail', function () {

    it('getPails with no valid path', function (done) {

        var pails = noexist.getPails();
        expect(pails).to.have.length(0);
        done();
    });

    it('getPailByLink no link', function (done) {

        var pail_id = pail.getPailByLink('link');
        expect(pail_id).to.not.exist();
        done();
    });

    it('createPail with workspace', function (done) {

        var config = { name: 'name', foo: 'bar' };
        var createPail = pail.createPail(config);
        pail.createWorkspace(createPail.id);
        expect(createPail.name).to.equal('name');
        expect(createPail.foo).to.equal('bar');
        expect(config.createTime).to.exist();
        expect(config.startTime).to.not.exist();
        expect(config.status).to.equal('created');
        done();
    });

    it('getPail', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        expect(getPail.foo).to.exist();
        done();
    });

    it('getPailByLink', function (done) {

        var pail_id = pail.getPailByLink('name');
        expect(pail_id).to.exist();
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
        var link = pail.getPailByLink('lastSuccess');
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
        var link = pail.getPailByLink('lastFail');
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
        var link = pail.getPailByLink('lastCancel');
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
        pail.deleteWorkspace(getPail.id);
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
        pail.createWorkspace(createPail.id);
        var tmpDir = Path.join(pail.settings.dirpath, createPail.id, pail.settings.workspace, 'tmp');
        var tmpFile = 'tmpFile';
        Fs.mkdirSync(tmpDir);
        Fs.writeFileSync(tmpDir+'/'+tmpFile, 'foo');
        var pails = pail.getPails(pail.settings.dirpath + '/' + createPail.id);
        expect(pails).to.have.length(1);
        pail.deleteWorkspace(createPail.id);
        pail.deletePail(createPail.id);
        var deletePails = pail.getPails(pail.settings.dirpath);
        expect(deletePails).to.have.length(0);
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

    it('deleteLink', function (done) {

        var config1 = { name: 'pail1', foo: 'bar' };
        var config2 = { name: 'pail2', foo: 'bar' };
        var createPail1 = pail.createPail(config1);
        var createPail2 = pail.createPail(config2);
        pail.createLink(createPail1.id, 'link');
        pail.createLink(createPail2.id, 'link');
        var link = pail.getPailByLink('link');
        expect(link).to.equal(createPail2.id);
        pail.deleteLink('link');
        pail.deletePail(createPail1.id);
        pail.deletePail(createPail2.id);
        var deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });
});
