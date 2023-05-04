import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../src/services/pluginService.js';
import Gpt3Service from '../src/services/gpt3Service.js';
import Gpt4Service from '../src/services/gpt4Service.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/refactorResultProcessor.js';
import TemplateLoader from '../src/services/templateLoaderService.js';
import PromptContext from '../src/services/promptContext.js';

describe('PluginService', () => {

  describe('executeMode method', () => {
    let gpt4ServiceStub

    beforeEach(() => {
      gpt4ServiceStub = sinon.stub(Gpt4Service, 'call')
    });
  
    afterEach(() => {
      if (gpt4ServiceStub) gpt4ServiceStub.restore()
    });

    it('should call Gpt4Service when mode is gpt3', async () => {
      gpt4ServiceStub.resolves('GPT3 result');
      const result = await PluginService.executeMode('gpt3', 'Test prompt');
      assert.strictEqual(result, 'GPT3 result');
      sinon.assert.calledWith(gpt4ServiceStub, 'Test prompt', 'gpt3');
    });

    it('should call Gpt4Service when mode is gpt4', async () => {
      gpt4ServiceStub.resolves('GPT4 result');
      const result = await PluginService.executeMode('gpt4', 'Test prompt');
      assert.strictEqual(result, 'GPT4 result');
      sinon.assert.calledWith(gpt4ServiceStub, 'Test prompt', 'gpt4');
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

      CliState.init([], '')
      await PluginService.call('Test input');

      assert(loadTemplateStub.calledWith('Test input', { files: [] }, sinon.match(/refactor$/)));
    });

    it('should pass RefactorResultProcessor.call the operations', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [{ "thing": 1 }] }');
      const refactorResultProcessorStub = sinon.stub(RefactorResultProcessor, 'call').resolves();

      CliState.init([], '')
      await PluginService.call('Test input');

      assert(refactorResultProcessorStub.calledWith({ operations: [{ thing: 1 }] }))

      refactorResultProcessorStub.restore();
    });

    it('should call loadTemplate with default templatePath when CliState.getTemplatePath() is empty or undefined', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [] }');
      CliState.init([], '');
      CliState.getTemplatePath = sinon.stub().returns('');
      
      await PluginService.call('Test input');
      
      assert(loadTemplateStub.calledWith(sinon.match.any, { files: [] }, "refactor"))
    });
  });

});