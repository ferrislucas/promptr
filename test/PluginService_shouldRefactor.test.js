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

  describe('shouldRefactor method', () => {
    it('returns true if templatePath is refactor', () => {
      const result = PluginService.shouldRefactor('refactor')
      assert.strictEqual(result, true)
    })

    it('returns true if templatePath is not provided', () => {
      const result = PluginService.shouldRefactor(undefined)
      assert.strictEqual(result, true)
    })

    it('returns false if templatePath is not refactor', () => {
      const result = PluginService.shouldRefactor('not-refactor')
      assert.strictEqual(result, false)
    })

    it('returns true if CliState.getExecuteFlag() is truthy', () => {
      sinon.stub(CliState, 'getExecuteFlag').returns(true)
      const result = PluginService.shouldRefactor('not-refactor')
      assert.strictEqual(result, true)
    })
  })

});