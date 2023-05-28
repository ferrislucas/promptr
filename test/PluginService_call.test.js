import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../src/services/pluginService.js';
import OpenAiGptService from '../src/services/OpenAiGptService.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/refactorResultProcessor.js';
import TemplateLoader from '../src/services/templateLoaderService.js';
import PromptContext from '../src/services/promptContext.js';
import TemplateLoaderService from '../src/services/templateLoaderService.js'
import { AutoContext } from '../src/services/AutoContext.js';

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
      executeModeStub = sinon.stub(PluginService, 'executeMode')
    });

    afterEach(() => {
      if (loadTemplateStub) loadTemplateStub.restore()
      if (buildContextStub) buildContextStub.restore()
      if (executeModeStub) executeModeStub.restore()
      sinon.restore()
    });

    it('should use refactor.txt as default template', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [] }');

      await PluginService.call('Test input');

      assert(loadTemplateStub.calledWith('Test input', { files: [] }, sinon.match(/refactor$/)));
    });

    describe('when AutoContext.call() returns some paths', () => {
      let autoContextPaths = ['test/path1', 'test/path2']
      
      beforeEach(() => {
        executeModeStub.resolves('{ "operations": [] }')
        sinon.stub(AutoContext, 'call').returns(autoContextPaths)
      })

      it('should pass the paths from AutoContext.call into PromptContext.call', async () => {
        await PluginService.call('Test input')

        assert(buildContextStub.calledWith(autoContextPaths))
      })
    })

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
      sinon.stub(CliState, 'getExecuteFlag').returns('')
      
      await PluginService.call('Test input');
      
      assert(loadTemplateStub.calledWith(sinon.match.any, { files: [] }, "refactor"))
    });
  });

});