import assert from 'assert';
import sinon from 'sinon';
import PluginService from '../pluginService.js';
import Gpt3Service from '../gpt3Service.js';
import Gpt4Service from '../gpt4Service.js';

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
});