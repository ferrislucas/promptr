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
  describe('loadTemplateFromPath', () => {
    it('should call FileService.load with correct path when loadTemplateFromPath is passed the string "refactor"', async () => {
      const fileServiceLoadStub = sinon.stub(FileService, 'load').resolves('Test content');

      await TemplateLoader.loadTemplateFromPath('refactor');

      assert(fileServiceLoadStub.called);

      fileServiceLoadStub.restore();
    });

    describe("testing built in templates", () => {
      let loadTemplateFromUrlStub

      beforeEach(() => {
        loadTemplateFromUrlStub = sinon.stub(TemplateLoader, 'loadTemplateFromUrl');
      })

      afterEach(() => {
        loadTemplateFromUrlStub.restore()
      })

      it('should return correct content for the refactor template', async () => {
        loadTemplateFromUrlStub.withArgs('https://gist.githubusercontent.com/ferrislucas/0c9c054133660e4f744e80b685417cfd/raw/6a19ad3f2084c67af4edbcdeb79f2f050433ff67/promptr-refactor-template-v3.0.2').resolves('Refactor content');
        
        const refactorContent = await TemplateLoader.loadTemplate('prompt', 'context', 'refactor');
        
        assert.strictEqual(refactorContent, 'Refactor content');      
      })

      it('should return correct content for the empty template', async () => {        
        loadTemplateFromUrlStub.withArgs('https://gist.githubusercontent.com/ferrislucas/e43ce36b49f37efe28e7414de4b71399/raw/7ef0afd5a094d392c255d7c0a98f6572dfc4bece/promptr-empty-template-v3.0.2').resolves('Empty content');
        
        const emptyContent = await TemplateLoader.loadTemplate('prompt', 'context', 'empty');
        
        assert.strictEqual(emptyContent, 'Empty content');
      })
      
      it('should return correct content for the swe template', async () => {
        loadTemplateFromUrlStub.withArgs('https://gist.githubusercontent.com/ferrislucas/a6a18fdafe32910c95829a700c0887ed/raw/50e533d2db8e7e138bfa925739e5e1f5c4498e95/promptr-swe-template-v3.0.2').resolves('SWE content')

        const sweContent = await TemplateLoader.loadTemplate('prompt', 'context', 'swe')

        assert.strictEqual(sweContent, 'SWE content');
      })

      it('should return correct content for the test-first template', async () => {
        loadTemplateFromUrlStub.withArgs('https://gist.githubusercontent.com/ferrislucas/5d38034e1eefaec0a3d32bdbca3a9ac6/raw/48f1a47d179f568cf1d1fa9271d5ad13fbdc3c85/promptr-test-first-template-v3.0.2').resolves('Test-First content');

        const testFirstContent = await TemplateLoader.loadTemplate('prompt', 'context', 'test-first');

        assert.strictEqual(testFirstContent, 'Test-First content');
      })
    })
  });

  describe('loadTemplate', () => {
    it('should load template from URL when template starts with http:// or https://', async () => {
      const loadTemplateFromUrlStub = sinon.stub(TemplateLoader, 'loadTemplateFromUrl').resolves('Test content from URL');

      await TemplateLoader.loadTemplate('prompt', 'context', 'http://example.com/template.txt');

      assert(loadTemplateFromUrlStub.called);

      loadTemplateFromUrlStub.restore();
    });

    it('should load template from path when template does not start with http:// or https://', async () => {
      const loadTemplateFromPathStub = sinon.stub(TemplateLoader, 'loadTemplateFromPath')
      loadTemplateFromPathStub.resolves('Test content from path');

      await TemplateLoader.loadTemplate('prompt', 'context', 'userTemplate');

      assert(loadTemplateFromPathStub.called);

      loadTemplateFromPathStub.restore();
    });
  });

  describe('loadTemplateFromUrl', () => {
    it('should fetch content from URL when loadTemplateFromUrl is called', async () => {
      const fetchStub = sinon.stub(global, 'fetch').resolves({ text: () => 'Test content from URL' });

      await TemplateLoader.loadTemplateFromUrl('http://example.com/template.txt');

      assert(fetchStub.called);

      fetchStub.restore();
    });
  });

});