// @flow

import path from 'path';
import mkdirp from 'mkdirp';
import fs from 'fs';
import rm from 'rmdir-sync';
import type {ILocalFS, Logger} from '@verdaccio/types';
import LocalFS, {fileExist} from '../local-fs';

let localFs: ILocalFS;
let localTempStorage: string;
const pkgFileName: string = 'package.json';

const logger: Logger = {
  error: (e)=> console.warn(e),
  info: (e)=> console.warn(e),
  debug: (e)=> console.warn(e),
  child: (e)=> console.warn(e),
  http: (e)=> console.warn(e),
  trace: (e)=> console.warn(e),
};

beforeAll(() => {
  localFs = new LocalFS('.', logger);
  localTempStorage = path.join('./_storage');
  rm(localTempStorage);
});

describe('Local FS test', ()=> {

  describe('writeJSON() group', ()=> {
    test('writeJSON()', (done) => {
      const data: any = '{data:5}';

      localFs.writeJSON(path.join(localTempStorage, 'package4'), data, (err)=> {
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('readJSON() group', ()=> {
    test('readJSON() success', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);

      localFs.readJSON(pkgFileName, (err, data)=> {
        expect(err).toBeNull();
        done();
      });
    });

    test('readJSON() fails', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-testt'), logger);

      localFs.readJSON(pkgFileName, (err)=> {
        expect(err).toBeTruthy();
        done();
      });
    });

    test('readJSON() fails corrupt', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test-corrupt'), logger);

      localFs.readJSON('corrupt.js', (err)=> {
        expect(err).toBeTruthy();
        done();
      });
    });
  });

  test('createJSON()', (done) => {
    localFs.createJSON(path.join(localTempStorage, 'package5'), '{data:6}', (err)=> {
      expect(err).toBeNull();
      done();
    });
  });

  test('createJSON() fails by fileExist', (done) => {
    localFs.createJSON(path.join(localTempStorage, 'package5'), '{data:6}', (err)=> {
      expect(err).not.toBeNull();
      expect(err.code).toBe(fileExist);
      done();
    });
  });

  test('deleteJSON()', (done) => {
    localFs.deleteJSON(path.join(localTempStorage, 'package5'), (err)=> {
      expect(err).toBeNull();
      done();
    });
  });

  test('unlockJSON()', (done) => {
    localFs.unlockJSON(path.join('package4'), (err)=> {
      expect(err).toBeNull();
      done();
    });
  });

  describe('removePackage() group', ()=> {

    beforeEach(() => {
      mkdirp(path.join(localTempStorage, '_toDelete'));
    });

    test('removePackage() success', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(localTempStorage, '_toDelete'), logger);
      localFs.removePackage((error)=> {
        expect(error).toBeNull();
        done();
      });
    });

    test('removePackage() fails', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(localTempStorage, '_toDelete_fake'), logger);
      localFs.removePackage((error) => {
        expect(error).toBeTruthy();
        expect(error.code).toBe('ENOENT');
        done();
      });
    });
  });

  describe('createReadStream() group', ()=> {

    test('createReadStream() success', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);
      const readTarballStream = localFs.createReadStream('test-readme-0.0.0.tgz');

      readTarballStream.on('error', function(err) {
        expect(err).toBeNull();
      });

      readTarballStream.on('content-length', function(content) {
        expect(content).toBe(352);
      });

      readTarballStream.on('end', function() {
        done();
      });

      readTarballStream.on('data', function(data) {
        expect(data).toBeDefined();
      });

    });

    test('createReadStream() fails', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);
      const readTarballStream = localFs.createReadStream('file-does-not-exist-0.0.0.tgz');

      readTarballStream.on('error', function(err) {
        expect(err).toBeTruthy();
        done();
      });

    });

  });

  describe('createWriteStream() group', ()=> {

    beforeEach(() => {
      const createWriteStreamFolder: string = path.join(localTempStorage, '_createWriteStream');
      rm(createWriteStreamFolder);
      mkdirp(createWriteStreamFolder);
    });

    test('createWriteStream() success', (done) => {
      const newFileLocationFolder: string = path.join(localTempStorage, '_createWriteStream');
      const newFileName: string = 'new-readme-0.0.0.tgz';
      const readmeStorage: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);
      const writeStorage: ILocalFS = new LocalFS(newFileLocationFolder, logger);
      const readTarballStream = readmeStorage.createReadStream('test-readme-0.0.0.tgz');
      const writeTarballStream = writeStorage.createWriteStream(newFileName);

      writeTarballStream.on('error', function(err) {
        expect(err).toBeNull();
        done();
      });

      writeTarballStream.on('success', function() {
        const fileLocation: string = path.join(newFileLocationFolder, newFileName);
        expect(fs.existsSync(fileLocation)).toBe(true);
        done();
      });

      readTarballStream.on('end', function() {
        writeTarballStream.done();
      });

      writeTarballStream.on('end', function() {
        done();
      });

      writeTarballStream.on('data', function(data) {
        expect(data).toBeDefined();
      });

      readTarballStream.on('error', function(err) {
        expect(err).toBeNull();
        done();
      });

      readTarballStream.pipe(writeTarballStream);

    });

    test('createWriteStream() abort', (done) => {
      const newFileLocationFolder: string = path.join(localTempStorage, '_createWriteStream');
      const newFileName: string = 'new-readme-abort-0.0.0.tgz';
      const readmeStorage: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);
      const writeStorage: ILocalFS = new LocalFS(newFileLocationFolder, logger);
      const readTarballStream = readmeStorage.createReadStream('test-readme-0.0.0.tgz');
      const writeTarballStream = writeStorage.createWriteStream(newFileName);

      writeTarballStream.on('error', function(err) {
        expect(err).toBeTruthy();
        done();
      });

      writeTarballStream.on('data', function(data) {
        expect(data).toBeDefined();
        writeTarballStream.abort();
      });

      readTarballStream.pipe(writeTarballStream);

    });

  });

  describe('lockAndReadJSON() group', ()=> {

    test('lockAndReadJSON() success', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-test'), logger);

      localFs.lockAndReadJSON(pkgFileName, (err, res) => {
        expect(err).toBeNull();
        done();
      });
    });

    test('lockAndReadJSON() fails', (done) => {
      const localFs: ILocalFS = new LocalFS(path.join(__dirname, 'fixtures/readme-testt'), logger);

      localFs.lockAndReadJSON(pkgFileName, (err, res) => {
        expect(err).toBeTruthy();
        done();
      });
    });

  });

});