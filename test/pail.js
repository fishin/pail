'use strict';

const Code = require('code');
const Fs = require('fs');
const Lab = require('lab');
const Path = require('path');
const Pail = require('../lib/index');

const internals = {};

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

const pail = new Pail({ dirPath: __dirname + '/tmp' });
const noexist = new Pail({ dirPath: __dirname + '/noexist' });

describe('pail', () => {

    it('getPails with no valid path', (done) => {

        const pails = noexist.getPails();
        expect(pails).to.have.length(0);
        done();
    });

    it('getPail with no valid path', (done) => {

        const nopail = noexist.getPail('noexist');
        expect(nopail).to.not.exist();
        done();
    });

    it('getPail with null pailId', (done) => {

        const nopail = noexist.getPail(null);
        expect(nopail).to.not.exist();
        done();
    });

    it('getFiles with no valid path', (done) => {

        const files = noexist.getFiles('noexist');
        expect(files.length).to.be.equal(0);
        done();
    });

    it('getPailByName no link', (done) => {

        const pailId = pail.getPailByName('link');
        expect(pailId).to.not.exist();
        done();
    });

    it('createPail with workspace', (done) => {

        const config = { name: 'name', foo: 'bar' };
        const createPail = pail.createPail(config);
        pail.createDir('workspace');
        expect(createPail.name).to.equal('name');
        expect(createPail.foo).to.equal('bar');
        expect(createPail.createTime).to.exist();
        expect(createPail.startTime).to.not.exist();
        expect(createPail.status).to.equal('created');
        done();
    });

    it('createPail with same name', (done) => {

        const config = { name: 'name', foo: 'bar' };
        const createPail = pail.createPail(config);
        pail.createDir('workspace');
        expect(createPail).to.not.exist();
        done();
    });

    it('createPail with existing workspace', (done) => {

        pail.createDir('workspace');
        done();
    });

    it('getPail', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        expect(getPail.foo).to.exist();
        done();
    });

    it('getPailByName', (done) => {

        const pailId = pail.getPailByName('name');
        expect(pailId).to.exist();
        done();
    });

    it('getPails', (done) => {

        const pails = pail.getPails();
        expect(pails).to.have.length(1);
        done();
    });

    it('updatePail starting', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.status = 'starting';
        const config = pail.updatePail(getPail);
        expect(config.startTime).to.exist();
        expect(config.finishTime).to.not.exist();
        expect(config.status).to.equal('started');
        done();
    });

    it('updatePail succeeded', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.status = 'succeeded';
        getPail.finishTime = null;
        const config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('succeeded');
        const link = pail.getPailByName('lastSuccess');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('updatePail failed', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.status = 'failed';
        getPail.finishTime = null;
        const config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('failed');
        const link = pail.getPailByName('lastFail');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('updatePail cancelled', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.status = 'cancelled';
        getPail.finishTime = null;
        const config = pail.updatePail(getPail);
        expect(config.finishTime).to.exist();
        expect(config.status).to.equal('cancelled');
        const link = pail.getPailByName('lastCancel');
        expect(link).to.equal(config.id);
        expect(config.updateTime).to.exist();
        done();
    });

    it('getLinks', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        const links = pail.getLinks(getPail.id);
        expect(links).to.have.length(5);
        done();
    });

    it('updatePail rename', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.name = 'newname';
        const config = pail.updatePail(getPail);
        expect(config.name).to.equal('newname');
        expect(config.updateTime).to.exist();
        done();
    });

    it('deletePail with workspace', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        pail.deleteDir('workspace');
        pail.deletePail(getPail.id);
        const links = pail.getLinks(getPail.id);
        expect(links).to.have.length(0);
        const deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteWorkspace with files and dirs', (done) => {

        const config = { foo: 'bar' };
        const createPail = pail.createPail(config);
        pail.createDir('workspace');
        const tmpDir = Path.join(pail.settings.dirPath, 'workspace', 'tmp');
        const tmpFile = 'tmpFile';
        Fs.mkdirSync(tmpDir);
        Fs.writeFileSync(tmpDir + '/' + tmpFile, 'foo');
        const pails = pail.getPails(pail.settings.dirPath + '/' + createPail.id);
        expect(pails).to.have.length(1);
        const files = pail.getFiles('workspace');
        expect(files.length).to.be.equal(0);
        pail.deleteDir('workspace');
        pail.deletePail(createPail.id);
        const deletePails = pail.getPails(pail.settings.dirPath);
        expect(deletePails).to.have.length(0);
        done();
    });

    it('getArtifact with workspace', (done) => {

        const fileName = 'blah.json';
        const blah = {
            foo: 'bar'
        };
        const workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        const contents = JSON.parse(pail.getArtifact('workspace', fileName));
        expect(contents.foo).to.equal('bar');
        pail.deleteDir('workspace');
        done();
    });

    it('copyArtifact null', (done) => {

        pail.copyArtifact('workspace', 'archive', null);
        // maybe check it doesnt throw an error?
        done();
    });

    it('copyArtifact noexist', (done) => {

        const fileName = 'blah.json';
        const blah = {
            foo: 'bar'
        };
        const workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        pail.copyArtifact('workspace', 'archive', fileName);
        const archive = JSON.parse(pail.getArtifact('archive', fileName));
        expect(archive).to.not.exist();
        pail.deleteDir('workspace');
        done();
    });

    it('copyArtifact', (done) => {

        const fileName = 'blah.json';
        const blah = {
            foo: 'bar'
        };
        const workspaceDir = Path.join(pail.settings.dirPath, 'workspace');
        pail.createDir('workspace');
        pail.createDir('archive');
        Fs.writeFileSync(workspaceDir + '/' + fileName, JSON.stringify(blah));
        const contents = JSON.parse(pail.getArtifact('workspace', fileName));
        pail.copyArtifact('workspace', 'archive', fileName);
        const archive = JSON.parse(pail.getArtifact('archive', fileName));
        expect(contents.foo).to.equal('bar');
        expect(archive.foo).to.equal('bar');
        pail.deleteDir('workspace');
        done();
    });

    it('getFiles', (done) => {

        const fileName = 'blah.json';
        const files = pail.getFiles('archive');
        pail.deleteDir('archive');
        expect(files[0]).to.equal(fileName);
        done();
    });

    it('createPail noname', (done) => {

        const config = { foo: 'bar' };
        const createPail = pail.createPail(config);
        expect(createPail.foo).to.equal('bar');
        expect(config.createTime).to.exist();
        expect(config.startTime).to.not.exist();
        expect(config.status).to.equal('created');
        done();
    });

    it('deleteWorkspace with no workspace noname', (done) => {

        pail.deleteDir('workspace');
        done();
    });

    it('getArtifact no workspace', (done) => {

        const fileName = 'blah.json';
        const contents = pail.getArtifact('workspace', fileName);
        expect(contents).to.not.exist();
        done();
    });

    it('updatePail noname starting', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        getPail.status = 'starting';
        const config = pail.updatePail(getPail);
        expect(config.startTime).to.exist();
        expect(config.finishTime).to.not.exist();
        expect(config.status).to.equal('started');
        done();
    });

    it('deletePail noname', (done) => {

        const pails = pail.getPails();
        const getPail = pail.getPail(pails[0]);
        pail.deletePail(getPail.id);
        const deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });

    it('deleteName', (done) => {

        const config1 = { name: 'pail1', foo: 'bar' };
        const config2 = { name: 'pail2', foo: 'bar' };
        const createPail1 = pail.createPail(config1);
        const createPail2 = pail.createPail(config2);
        pail.createName(createPail1.id, 'link');
        pail.createName(createPail2.id, 'link');
        const link = pail.getPailByName('link');
        expect(link).to.equal(createPail2.id);
        pail.deleteName('link');
        pail.deletePail(createPail1.id);
        pail.deletePail(createPail2.id);
        const deletePails = pail.getPails();
        expect(deletePails).to.have.length(0);
        done();
    });
});
