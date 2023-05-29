import assert from 'assert';
import sinon from 'sinon';
import PromptrService from '../src/services/PromptrService.js';
import OpenAiGptService from '../src/services/OpenAiGptService.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/RefactorResultProcessor.js';
import TemplateLoader from '../src/services/templateLoaderService.js';
import PromptContext from '../src/services/PromptContext.js';
import TemplateLoaderService from '../src/services/templateLoaderService.js'

describe('PromptrService', () => {

  beforeEach(() => {
    CliState.init([], '')
  })

  describe('shouldRefactor method', () => {
    it('returns true if templatePath is refactor', () => {
      const result = PromptrService.shouldRefactor('refactor')
      assert.strictEqual(result, true)
    })

    it('returns true if templatePath is not provided', () => {
      const result = PromptrService.shouldRefactor(undefined)
      assert.strictEqual(result, true)
    })

    it('returns false if templatePath is not refactor', () => {
      const result = PromptrService.shouldRefactor('not-refactor')
      assert.strictEqual(result, false)
    })

    it('returns true if CliState.getExecuteFlag() is truthy', () => {
      sinon.stub(CliState, 'getExecuteFlag').returns(true)
      const result = PromptrService.shouldRefactor('not-refactor')
      assert.strictEqual(result, true)
    })
  })

});