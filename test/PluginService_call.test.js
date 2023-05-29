import assert from 'assert';
import sinon from 'sinon';
import PromptrService from '../src/services/PromptrService.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/RefactorResultProcessor.js';
import TemplateLoader from '../src/services/TemplateLoader.js';
import PromptContext from '../src/services/PromptContext.js';
import AutoContext from '../src/services/AutoContext.js';

describe('PromptrService', () => {

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
      executeModeStub = sinon.stub(PromptrService, 'executeMode')
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

      await PromptrService.call('Test input');

      assert(loadTemplateStub.calledWith('Test input', { files: [] }, sinon.match(/refactor$/)));
    });

    describe('when AutoContext.call() returns some paths', () => {
      let autoContextPaths = ['test/path1', 'test/path2']
      let autoContextStub
      const prompt = "Test prompt"
      
      beforeEach(() => {
        executeModeStub.resolves('{ "operations": [] }')
        autoContextStub = sinon.stub(AutoContext, 'call')
        autoContextStub.returns(autoContextPaths)
      })

      it('should pass the paths from AutoContext.call into PromptContext.call', async () => {
        await PromptrService.call(prompt)

        assert(buildContextStub.calledWith(autoContextPaths))
      })

      it('passes the prompt to AutoContext.call', async () => {
        await PromptrService.call(prompt)

        assert(autoContextStub.calledWith(prompt))
      })

      describe('when AutoContext is disabled', () => {
        beforeEach(() => {
          const args = ['node', 'index.js', '-m', 'gpt3', '-p', prompt, '--disable-auto-context']
          CliState.init(args)
        })

        it('should not pass the paths from AutoContext.call into PromptContext.call', async () => {
          await PromptrService.call(prompt)
  
          assert(buildContextStub.calledWith([]))
        })
      })
    })

    it('should pass RefactorResultProcessor.call the operations', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [{ "thing": 1 }] }');
      const refactorResultProcessorStub = sinon.stub(RefactorResultProcessor, 'call').resolves();

      await PromptrService.call('Test input');

      assert(refactorResultProcessorStub.calledWith({ operations: [{ thing: 1 }] }))

      refactorResultProcessorStub.restore();
    });

    it('should call loadTemplate with default templatePath when CliState.getTemplatePath() is empty or undefined', async () => {
      loadTemplateStub.resolves('Test content');
      buildContextStub.resolves({ files: [] });
      executeModeStub.resolves('{ "operations": [] }');
      sinon.stub(CliState, 'getExecuteFlag').returns('')
      
      await PromptrService.call('Test input');
      
      assert(loadTemplateStub.calledWith(sinon.match.any, { files: [] }, "refactor"))
    });
  });

});