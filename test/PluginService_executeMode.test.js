import assert from 'assert';
import sinon from 'sinon';
import PromptrService from '../src/services/PromptrService.js';
import OpenAiGptService from '../src/services/OpenAiGptService.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/RefactorResultProcessor.js';
import TemplateLoaderService from '../src/services/TemplateLoader.js'

describe('PromptrService', () => {

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
      sinon.restore()
    });

    it('should call OpenAiGptService when mode is gpt3', async () => {
      OpenAiGptServiceStub.resolves('GPT3 result');
      const result = await PromptrService.executeMode('gpt3', 'Test prompt');
      assert.strictEqual(result, 'GPT3 result');
      sinon.assert.calledWith(OpenAiGptServiceStub, 'Test prompt', 'gpt3');
    });

    it('should call OpenAiGptService when mode is gpt4', async () => {
      OpenAiGptServiceStub.resolves('GPT4 result');
      const result = await PromptrService.executeMode('gpt4', 'Test prompt');
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
    
        await PromptrService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass true to OpenAiGptService.call() when templatePath is null', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns(null)
        OpenAiGptServiceStub.resolves('output')
    
        await PromptrService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass true to OpenAiGptService.call() when templatePath is undefined', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns(undefined)
        OpenAiGptServiceStub.resolves('output')
    
        await PromptrService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, true))
      })
    
      it('should pass false to OpenAiGptService.call() when templatePath is not refactor, null, or undefined', async () => {
        sinon.stub(CliState, 'getTemplatePath').returns('other-template')
        OpenAiGptServiceStub.resolves('output')
        sinon.stub(TemplateLoaderService, 'loadTemplate').resolves('')
    
        await PromptrService.executeMode('gpt4', 'Test prompt')
    
        assert(OpenAiGptService.call.calledWith(sinon.match.any, sinon.match.any, false))
      })

    });
  });

});