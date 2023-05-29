import assert from 'assert';
import sinon from 'sinon';
import TemplateLoader from '../src/services/TemplateLoader.js';
import TemplateUrl from '../src/services/TemplateUrl.js';


describe('TemplateLoader', () => {
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

    describe("testing built in templates", () => {
      let loadTemplateFromUrlStub

      beforeEach(() => {
        loadTemplateFromUrlStub = sinon.stub(TemplateLoader, 'loadTemplateFromUrl');
      })

      afterEach(() => {
        loadTemplateFromUrlStub.restore()
      })

      it('should return correct content for the refactor template', async () => {
        loadTemplateFromUrlStub.withArgs(TemplateUrl.refactor).resolves('Refactor content');
        
        const refactorContent = await TemplateLoader.loadTemplate('prompt', 'context', 'refactor');
        
        assert.strictEqual(refactorContent, 'Refactor content');      
      })

      it('should return correct content for the empty template', async () => {        
        loadTemplateFromUrlStub.withArgs(TemplateUrl.empty).resolves('Empty content');
        
        const emptyContent = await TemplateLoader.loadTemplate('prompt', 'context', 'empty');
        
        assert.strictEqual(emptyContent, 'Empty content');
      })
      
      it('should return correct content for the swe template', async () => {
        loadTemplateFromUrlStub.withArgs(TemplateUrl.swe).resolves('SWE content')

        const sweContent = await TemplateLoader.loadTemplate('prompt', 'context', 'swe')

        assert.strictEqual(sweContent, 'SWE content');
      })

      it('should return correct content for the test-first template', async () => {
        loadTemplateFromUrlStub.withArgs(TemplateUrl.testFirst).resolves('Test-First content');

        const testFirstContent = await TemplateLoader.loadTemplate('prompt', 'context', 'test-first');

        assert.strictEqual(testFirstContent, 'Test-First content');
      })
    })
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