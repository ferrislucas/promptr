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