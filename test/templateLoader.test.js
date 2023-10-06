import assert from 'assert'
import sinon from 'sinon'
import TemplateLoader from '../src/services/TemplateLoader.js'

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

    it('should expand liduidjs templating tags in the prompt', async () => {
      const result = await TemplateLoader.loadTemplate('prompt: {{context.test}}', { test: 42 }, 'empty')
      assert.strictEqual(result.trim(), 'prompt: 42')
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