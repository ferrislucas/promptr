import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../src/services/pluginService.js';
import Gpt3Service from '../src/services/gpt3Service.js';
import Gpt4Service from '../src/services/gpt4Service.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/refactorResultProcessor.js';
import { FileService } from '../src/services/fileService.js';
import TemplateLoader from '../src/services/templateLoaderService.js';


describe('TemplateLoader', () => {
  describe("loadTemplateFromPath", () => {
    it('should call FileService.load with correct path when loadTemplateFromPath is passed the string "refactor"', async () => {
      const fileServiceLoadStub = sinon.stub(FileService, 'load').resolves('Test content');

      await TemplateLoader.loadTemplateFromPath('refactor');

      assert(fileServiceLoadStub.called);

      fileServiceLoadStub.restore();
    });
  });

  describe("loadTemplate", () => {
    it('should load template from URL when template starts with http:// or https://', async () => {
      const loadTemplateFromUrlStub = sinon.stub(TemplateLoader, 'loadTemplateFromUrl').resolves('Test content from URL');

      await TemplateLoader.loadTemplate('prompt', 'context', 'http://example.com/template.txt');

      assert(loadTemplateFromUrlStub.called);

      loadTemplateFromUrlStub.restore();
    });

    it('should load template from path when template does not start with http:// or https://', async () => {
      const loadTemplateFromPathStub = sinon.stub(TemplateLoader, 'loadTemplateFromPath').resolves('Test content from path');

      await TemplateLoader.loadTemplate('prompt', 'context', 'refactor');

      assert(loadTemplateFromPathStub.called);

      loadTemplateFromPathStub.restore();
    });
  });

  describe("loadTemplateFromUrl", () => {
    it('should fetch content from URL when loadTemplateFromUrl is called', async () => {
      const fetchStub = sinon.stub(global, 'fetch').resolves({ text: () => 'Test content from URL' });

      await TemplateLoader.loadTemplateFromUrl('http://example.com/template.txt');

      assert(fetchStub.called);

      fetchStub.restore();
    });
  });

});