import { describe, it } from 'mocha'
import assert from 'assert';
import sinon from 'sinon';
import PromptContext from '../src/services/PromptContext.js';
import { FileService } from '../src/services/FileService.js';

describe('PromptContext', () => {

  describe('call method', () => {
    let fileServiceStub;

    beforeEach(() => {
      fileServiceStub = sinon.stub(FileService, 'load');
    });

    afterEach(() => {
      if (fileServiceStub) fileServiceStub.restore();
    });

    it('should build context with files', async () => {
      fileServiceStub.resolves('File content');

      const args = ['file1.js', 'file2.js'];
      const context = await PromptContext.call(args);

      assert.deepEqual(context, {
        files: [
          { filename: 'file1.js', content: 'File content' },
          { filename: 'file2.js', content: 'File content' }
        ]
      });
    });

    it('should not add files with null content to context', async () => {
      fileServiceStub.onCall(0).resolves('File content');
      fileServiceStub.onCall(1).resolves(null);

      const args = ['file1.js', 'file2.js'];
      const context = await PromptContext.call(args);

      assert.deepEqual(context, {
        files: [
          { filename: 'file1.js', content: 'File content' }
        ]
      });
    });
  });

});
