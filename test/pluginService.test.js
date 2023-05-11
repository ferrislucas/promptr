import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../src/services/pluginService.js';
import OpenAiGptService from '../src/services/OpenAiGptService.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/refactorResultProcessor.js';
import TemplateLoader from '../src/services/templateLoaderService.js';
import PromptContext from '../src/services/promptContext.js';
import TemplateLoaderService from '../src/services/templateLoaderService.js'

describe('PluginService', () => {

  beforeEach(() => {
    CliState.init([], '')
  })

  describe('executeMode method', () => {
    let OpenAiGptServiceStub

    beforeEach(() => {
      OpenAiGptServiceStub = sinon.stub(OpenAiGptService, 'call')
    });
  
    afterEach(() => {
      if (OpenAiGptServiceStub) OpenAiGptServiceStub.restore()
    });

    it('should call OpenAiGptService when mode is gpt3', async () => {
      OpenAiGptServiceStub.resolves('GPT3 result');
      const result = await PluginService.executeMode('gpt3', 'Test prompt');
      assert.strictEqual(result, 'GPT3 result');
      sinon.assert.calledWith(OpenAiGptServiceStub, 'Test prompt', 'gpt3');
    });

    it('should call OpenAiGptService when mode is gpt4', async () => {
      OpenAiGptServiceStub.resolves('GPT4 result');
      const result = await PluginService.executeMode('gpt4', 'Test prompt');
      assert.strictEqual(result, 'GPT4 result');
      sinon.assert.calledWith(OpenAiGptServiceStub, 'Test prompt', 'gpt4');
    });

    describe('Requesting json output from OpenAiGptService', () => {

      beforeEach(() => {      
        sinon.stub(RefactorResultProcessor, 'call')
      })
    
      afterEach(() => {
        sinon.restore()
      })
    
      it('should pass true to OpenAiGptService.call() when templatePath is refactor', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns('refactor')
        OpenAiGptServiceStub.resolves('output')
    
        await PluginService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass true to OpenAiGptService.call() when templatePath is null', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns(null)
        OpenAiGptServiceStub.resolves('output')
    
        await PluginService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass true to OpenAiGptService.call() when templatePath is undefined', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns(undefined)
        OpenAiGptServiceStub.resolves('output')
    
        await PluginService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass false to OpenAiGptService.call() when templatePath is not refactor, null, or undefined', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns('other-template')
        OpenAiGptServiceStub.resolves('output')
        sinon.stub(TemplateLoaderService, 'loadTemplate').resolves('')
    
        await PluginService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, false))
      })

    });
  });

  describe('call method', () => {
    let executeModeStub
    let loadTemplateStub
    let buildContextStub
    
    beforeEach(() => {
      loadTemplateStub = sinon.stub(TemplateLoader, 'loadTemplate')
      buildContextStub = sinon.stub(PromptContext, 'call')
    });

    afterEach(() => {
      if (loadTemplateStub) loadTemplateStub.restore()
      if (buildContextStub) buildContextStub.restore()
    });

    beforeEach(() => {    
      executeModeStub = sinon.stub(PluginService, 'executeMode')
    });
  
    afterEach(() => {
      if (executeModeStub) executeModeStub.restore()
    });

    it('should use refactor.txt as default template', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [] }');

      await PluginService.call('Test input');

      assert(loadTemplateStub.calledWith('Test input', { files: [] }, sinon.match(/refactor$/)));
    });

    it('should pass RefactorResultProcessor.call the operations', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [{ "thing": 1 }] }');
      const refactorResultProcessorStub = sinon.stub(RefactorResultProcessor, 'call').resolves();

      await PluginService.call('Test input');

      assert(refactorResultProcessorStub.calledWith({ operations: [{ thing: 1 }] }))

      refactorResultProcessorStub.restore();
    });

    it('should call loadTemplate with default templatePath when CliState.getTemplatePath() is empty or undefined', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [] }');
      CliState.getTemplatePath = sinon.stub().returns('');
      
      await PluginService.call('Test input');
      
      assert(loadTemplateStub.calledWith(sinon.match.any, { files: [] }, "refactor"))
    });
  });

});