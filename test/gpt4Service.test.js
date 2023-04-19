import assert from 'assert';
import sinon from 'sinon';
import Gpt4Service from '../src/services/gpt4Service.js';
import { Configuration, OpenAIApi } from 'openai';
import ConfigService from '../src/services/configService.js';

describe('Gpt4Service', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should return the result from the model', async () => {
    const prompt = 'What is the capital of France?';
    const expectedResult = 'The capital of France is Paris.';

    const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } });
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { content: expectedResult } }
        ]
      }
    });

    const result = await Gpt4Service.call(prompt);

    assert.strictEqual(result, expectedResult);
    sinon.assert.calledOnce(configStub);
    sinon.assert.calledOnce(openaiStub);
  });

  it('should return null when the response does not contain choices', async () => {
    const prompt = 'What is the capital of France?';

    const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } });
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {}
    });

    const result = await Gpt4Service.call(prompt);

    assert.strictEqual(result, null);
    sinon.assert.calledOnce(configStub);
    sinon.assert.calledOnce(openaiStub);
  });
});