import fs from 'fs';
import path from 'path';
import assert from 'assert';
import RefactorResultProcessor from '../refactorResultProcessor.js'

describe('RefactorResultProcessor', () => {
  describe('.call()', () => {
    afterEach(() => {
      fs.unlinkSync(path.resolve('test/testDir/testFile.txt'));
      fs.rmdirSync(path.resolve('test/testDir'), { recursive: true });
    });

    it('should create file at arbitrary directory tree depth', () => {
      const data = {
        operations: [
          {
            crudOperation: 'create',
            filePath: 'test/testDir/testFile.txt',
            fileContents: 'This is a test file'
          }
        ]
      };

      RefactorResultProcessor.call(data);

      assert(fs.existsSync(path.resolve('test/testDir/testFile.txt')));
    });
  });
});