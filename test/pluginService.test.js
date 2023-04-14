import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../src/services/pluginService.js';
import Gpt3Service from '../src/services/gpt3Service.js';
import Gpt4Service from '../src/services/gpt4Service.js';
import CliState from '../src/cliState.js';
import RefactorResultProcessor from '../src/services/refactorResultProcessor.js';

describe('PluginService', () => {
  it('should call Gpt3Service when mode is gpt3', async () => {
    const gpt3ServiceStub = sinon.stub(Gpt3Service, 'call').resolves('GPT3 result');
    const result = await PluginService.executeMode('gpt3', 'Test prompt');
    assert.strictEqual(result, 'GPT3 result');
    gpt3ServiceStub.restore();
  });

  it('should call Gpt4Service when mode is gpt4', async () => {
    const gpt4ServiceStub = sinon.stub(Gpt4Service, 'call').resolves('GPT4 result');
    const result = await PluginService.executeMode('gpt4', 'Test prompt');
    assert.strictEqual(result, 'GPT4 result');
    gpt4ServiceStub.restore();
  });

  it('should use refactor.txt as default template', async () => {
    const loadTemplateStub = sinon.stub(PluginService, 'loadTemplate').resolves('Test content');
    const buildContextStub = sinon.stub(PluginService, 'buildContext').resolves({ files: [] });
    const executeModeStub = sinon.stub(PluginService, 'executeMode').resolves('{ "operations": [] }');

    CliState.init([], '')
    await PluginService.call('Test input');

    assert(loadTemplateStub.calledWith('Test input', { files: [] }, sinon.match(/refactor.txt$/)));

    loadTemplateStub.restore();
    buildContextStub.restore();
    executeModeStub.restore();
  });

  it('should pass RefactorResultProcessor.call the operations', async () => {
    const loadTemplateStub = sinon.stub(PluginService, 'loadTemplate').resolves('Test content');
    const buildContextStub = sinon.stub(PluginService, 'buildContext').resolves({ files: [] });
    const executeModeStub = sinon.stub(PluginService, 'executeMode').resolves('{ "operations": [{ "thing": 1 }] }');
    const refactorResultProcessorStub = sinon.stub(RefactorResultProcessor, 'call').resolves();

    CliState.init([], '')
    await PluginService.call('Test input');

    assert(refactorResultProcessorStub.calledWith({ operations: [{ thing: 1 }] }))

    refactorResultProcessorStub.restore();
    loadTemplateStub.restore();
    buildContextStub.restore();
    executeModeStub.restore();
  });
});