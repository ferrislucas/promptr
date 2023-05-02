import { FileService } from '../src/services/fileService.js';
import fs from 'fs';
import assert from 'assert';
import sinon from 'sinon';

describe('FileService', () => {
  beforeEach(async () => {
    try {
      await fs.mkdir('tmp', () => {});
      console.log('Folder created successfully');
    } catch (err) {
      console.error(err);
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('write', () => {
    it('should write data to a file', async () => {
      const data = 'test data';
      const filePath = 'tmp/test-write.txt';
      await FileService.write(data, filePath);
      const fileContents = await fs.promises.readFile(filePath, 'utf-8');
      assert.strictEqual(fileContents, data);
    });
  });

  describe('load', () => {
    it('should load data from a file', async () => {
      const data = 'test data';
      const filePath = 'tmp/test-load.txt';
      await fs.promises.writeFile(filePath, data);
      const fileContents = await FileService.load(filePath);
      assert.strictEqual(fileContents, data);
    });

    it('should return an empty string if the file does not exist', async () => {
      const filePath = 'tmp/nonexistent-file.txt';
      const fileContents = await FileService.load(filePath);
      assert.strictEqual(fileContents, '');
    });
  });

  describe('fileExists', () => {
    it('should return true if the file exists', async () => {
      const filePath = 'tmp/test-fileExists.txt';
      await fs.promises.writeFile(filePath, '');
      const exists = await FileService.fileExists(filePath);
      assert.strictEqual(exists, true);
    });

    it('should return false if the file does not exist', async () => {
      const filePath = 'tmp/nonexistent-file.txt';
      const exists = await FileService.fileExists(filePath);
      assert.strictEqual(exists, false);
    });
  });
});