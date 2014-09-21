var Fs = require('fs');
var Hapi = require('hapi');
var Lab = require('lab');
var Pail = require('../lib/index');
var Path = require('path');

var internals = {};

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;

var pail = new Pail({ pailPath: '/tmp/testpail', workspace: 'workspace'});

describe('pail', function () {

    it('getDirs with no valid path', function (done) {

        var dirs = pail.getDirs('foo');
        expect(dirs).to.have.length(0);
        done();
    });

    it('save', function (done) {

        var config = { foo: 'bar' };
        var savePail = pail.savePail(config);
        expect(savePail.foo).to.exist;
        done();
    });

    it('get pails', function (done) {

        var pails = pail.getPails();
        expect(pails).to.have.length(1);
        done();
    });

    it('get', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        expect(getPail.foo).to.exist;
        done();
    });

    it('link', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        pail.linkPail(getPail.id, 'link');
        done();
    });

    it('get by linkpath', function (done) {

        var pail_id = pail.getPailByName('link');
        expect(pail_id).to.exist;
        done();
    });

    it('unlink', function (done) {

        pail.unlinkPail('link');
        var pail_id = null;
        setTimeout(function() {
            pail_id = pail.getPailByName('link');
        }, 100);
        expect(pail_id).to.not.exist;
        done();
    });

    it('save created', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'created';
        var config = pail.savePail(getPail);
        expect(config.createTime).to.exist;
        expect(config.startTime).to.not.exist;
        expect(config.status).to.equal('created');
        done();
    });

    it('save starting', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'starting';
        var config = pail.savePail(getPail);
        expect(config.startTime).to.exist;
        expect(config.finishTime).to.not.exist;
        expect(config.status).to.equal('started');
        done();
    });

    it('save succeeded', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'succeeded';
        getPail.finishTime = null;
        var config = pail.savePail(getPail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('succeeded');
        done();
    });

    it('save failed', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'failed';
        getPail.finishTime = null;
        var config = pail.savePail(getPail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('failed');
        done();
    });

    it('save cancelled', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        getPail.status = 'cancelled';
        getPail.finishTime = null;
        var config = pail.savePail(getPail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('cancelled');
        done();
    });

    it('delete', function (done) {

        var pails = pail.getPails();
        var getPail = pail.getPail(pails[0]);
        pail.deletePail(getPail.id);
        var deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteWorkspace with files and dirs', function (done) {

        var config = { foo: 'bar' };
        var savePail = pail.savePail(config);
        var tmpDir = Path.join(pail.settings.pailPath, savePail.id, pail.settings.workspace, 'tmp');
        var tmpFile = 'tmpFile';
        Fs.mkdirSync(tmpDir);
        Fs.writeFileSync(tmpDir+'/'+tmpFile, 'foo');
        var dirs = pail.getDirs(pail.settings.pailPath + '/' + savePail.id);
        expect(dirs).to.have.length(1);
        pail.deletePail(savePail.id);
        var dirs2 = pail.getDirs(pail.settings.pailPath);
        expect(dirs2).to.have.length(0);
        done();
    });

});
