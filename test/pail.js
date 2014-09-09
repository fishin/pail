var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Pail = require('../lib/pail');
var Path = require('path');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

var pailPath = '/tmp/pail';

var workspace = 'workspace';

describe('pail', function () {

    it('save', function (done) {

        var config = { foo: 'bar' };
        var pail = Pail.savePail(pailPath, config);
        expect(pail.foo).to.exist;
        pail.bar = 'foo';
        done();
    });

    it('get pails', function (done) {

        var pails = Pail.getPails(pailPath);
        expect(pails).to.have.length(1);
        done();
    });

    it('get', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        expect(pail.foo).to.exist;
        done();
    });

    it('link', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        Pail.linkPail(pailPath, pail.id, 'link');
        done();
    });

    it('get by linkpath', function (done) {

        var pail_id = Pail.getPailByName(pailPath, 'link');
        expect(pail_id).to.exist;
        done();
    });

    it('unlink', function (done) {

        Pail.unlinkPail(pailPath, 'link');
        var pail_id = null;
        setTimeout(function() {
            pail_id = Pail.getPailByName(pailPath, 'link');
        }, 100);
        expect(pail_id).to.not.exist;
        done();
    });

    it('save created', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        pail.status = 'created';
        var config = Pail.savePail(pailPath, pail);
        expect(config.createTime).to.exist;
        expect(config.startTime).to.not.exist;
        expect(config.status).to.equal('created');
        done();
    });

    it('save starting', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        pail.status = 'starting';
        var config = Pail.savePail(pailPath, pail);
        expect(config.startTime).to.exist;
        expect(config.finishTime).to.not.exist;
        expect(config.status).to.equal('started');
        done();
    });

    it('save succeeded', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        pail.status = 'succeeded';
        pail.finishTime = null;
        var config = Pail.savePail(pailPath, pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('succeeded');
        done();
    });

    it('save failed', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        pail.status = 'failed';
        pail.finishTime = null;
        var config = Pail.savePail(pailPath, pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('failed');
        done();
    });

    it('save cancelled', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        pail.status = 'cancelled';
        pail.finishTime = null;
        var config = Pail.savePail(pailPath, pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('cancelled');
        done();
    });

    it('delete', function (done) {

        var pails = Pail.getPails(pailPath);
        var pail = Pail.getPail(pailPath, pails[0]);
        Pail.deletePail(pailPath, pail.id);
        var deletePails = Pail.getPails(pailPath);
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteWorkspace with files and dirs', function (done) {

        var config = { foo: 'bar' };
        var pail = Pail.savePail(pailPath, config);
        var tmpDir = Path.join(pailPath, pail.id, workspace, 'tmp');
        var tmpFile = 'tmpFile';
        Fs.mkdirSync(tmpDir);
        Fs.writeFileSync(tmpDir+'/'+tmpFile, 'foo');
        var dirs = Pail.getDirs(pailPath + '/' + pail.id);
        expect(dirs).to.have.length(1);
        Pail.deletePail(pailPath, pail.id);
        var dirs2 = Pail.getDirs(pailPath);
        expect(dirs2).to.have.length(0);
        done();
    });

});
