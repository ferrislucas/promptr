import fs from 'fs';
import path from 'path';
import assert from 'assert';
import RefactorResultProcessor from '../src/services/RefactorResultProcessor.js'

describe('RefactorResultProcessor', () => {
  describe('.call()', () => {
    afterEach(() => {
      if (fs.existsSync(path.resolve('test/testDir/testFile.txt'))) fs.unlinkSync(path.resolve('test/testDir/testFile.txt'));
      if (fs.existsSync(path.resolve('test/testDir'))) fs.rmdirSync(path.resolve('test/testDir'), { recursive: true })
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

    it('should update file contents', () => {
      const createData = {
        operations: [
          {
            crudOperation: 'create',
            filePath: 'test/testDir/testFile.txt',
            fileContents: 'This is a test file'
          }
        ]
      };

      RefactorResultProcessor.call(createData);

      const updateData = {
        operations: [
          {
            crudOperation: 'update',
            filePath: 'test/testDir/testFile.txt',
            fileContents: 'This is an updated test file'
          }
        ]
      };

      RefactorResultProcessor.call(updateData);

      const fileContents = fs.readFileSync(path.resolve('test/testDir/testFile.txt'), 'utf-8');
      assert.strictEqual(fileContents, 'This is an updated test file');
    });

    it('should delete file', () => {
      const createData = {
        operations: [
          {
            crudOperation: 'create',
            filePath: 'test/testDir/testFile.txt',
            fileContents: 'This is a test file'
          }
        ]
      };

      RefactorResultProcessor.call(createData);

      const deleteData = {
        operations: [
          {
            crudOperation: 'delete',
            filePath: 'test/testDir/testFile.txt'
          }
        ]
      };

      RefactorResultProcessor.call(deleteData);

      assert(!fs.existsSync(path.resolve('test/testDir/testFile.txt')));
    });

    it('should move file to another location', () => {
      const createData = {
        operations: [
          {
            crudOperation: 'create',
            filePath: 'test/testDir/testFile.txt',
            fileContents: 'This is a test file'
          }
        ]
      };

      RefactorResultProcessor.call(createData);

      const moveData = {
        operations: [
          {
            crudOperation: 'move',
            filePath: 'test/testDir/testFile.txt',
            destinationPath: 'test/testDirNew/testFile.txt'
          }
        ]
      };

      RefactorResultProcessor.call(moveData);

      assert(!fs.existsSync(path.resolve('test/testDir/testFile.txt')));
      assert(fs.existsSync(path.resolve('test/testDirNew/testFile.txt')));

      if (fs.existsSync(path.resolve('test/testDirNew/testFile.txt'))) fs.unlinkSync(path.resolve('test/testDirNew/testFile.txt'));
      if (fs.existsSync(path.resolve('test/testDirNew'))) fs.rmdirSync(path.resolve('test/testDirNew'), { recursive: true });
    });

    it('handles deleting nested folders', () => {
      const createOperations = {
        operations: [
          {
            crudOperation: 'create',
            filePath: 'test/testDir/nested/testFile.txt',
            fileContents: 'This is a test file'
          }
        ]
      }

      // create a nested folder
      RefactorResultProcessor.call(createOperations)
      assert(fs.existsSync(path.resolve('test/testDir/nested')))

      // delete the nested folder
      const deleteOperations = {
        operations: [
          {
            crudOperation: 'delete',
            filePath: 'test/testDir/nested',
          }
        ]
      }
      RefactorResultProcessor.call(deleteOperations)

      assert(!fs.existsSync(path.resolve('test/testDir/nested')))

      if (fs.existsSync(path.resolve('test/testDirNew/testFile.txt'))) fs.unlinkSync(path.resolve('test/testDirNew/testFile.txt'))
      if (fs.existsSync(path.resolve('test/testDirNew/nested'))) fs.rmdirSync(path.resolve('test/testDirNew'), { recursive: true })
    });
  });
});