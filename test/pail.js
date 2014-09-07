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

describe('pail', function () {

    it('save', function (done) {

        var config = { foo: 'bar' };
        var pail = Pail.savePail(config);
        expect(pail.foo).to.exist;
        pail.bar = 'foo';
        done();
    });

    it('get pails', function (done) {

        var pails = Pail.getPails();
        expect(pails).to.have.length(1);
        done();
    });

    it('get', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        expect(pail.foo).to.exist;
        done();
    });
    
    it('save created', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        pail.status = 'created';
        var config = Pail.savePail(pail);
        expect(config.createTime).to.exist;
        expect(config.startTime).to.not.exist;
        expect(config.status).to.equal('created');
        done();
    });

    it('save starting', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        pail.status = 'starting';
        var config = Pail.savePail(pail);
        expect(config.startTime).to.exist;
        expect(config.finishTime).to.not.exist;
        expect(config.status).to.equal('started');
        done();
    });

    it('save succeeded', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        pail.status = 'succeeded';
        pail.finishTime = null;
        var config = Pail.savePail(pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('succeeded');
        done();
    });

    it('save failed', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        pail.status = 'failed';
        pail.finishTime = null;
        var config = Pail.savePail(pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('failed');
        done();
    });

    it('save cancelled', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        pail.status = 'cancelled';
        pail.finishTime = null;
        var config = Pail.savePail(pail);
        expect(config.finishTime).to.exist;
        expect(config.status).to.equal('cancelled');
        done();
    });

    it('delete', function (done) {

        var pails = Pail.getPails();
        var pail = Pail.getPail(pails[0]);
        Pail.deletePail(pail.id);
        var deletePails = Pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });


/*
   if (config.status === 'succeeded' || config.status === 'failed' || config.status === 'cancelled') {
       config.finishTime = new Date().getTime();
   }
   else if (config.status === 'starting') {
       config.startTime = new Date().getTime();
       config.status = 'started';
   }
*/

    it('getDirs with file', function (done) {

        var tmpDir = Path.join(__dirname, 'tmp');
        Fs.mkdirSync(tmpDir);
        var dirs = Pail.getDirs(__dirname);
        expect(dirs).to.have.length(1);
        Fs.rmdirSync(tmpDir);
        var dirs2 = Pail.getDirs(__dirname);
        expect(dirs2).to.have.length(0);
        done();
    });

});
