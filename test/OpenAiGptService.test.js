import assert from 'assert';
import sinon from 'sinon';
import OpenAiGptService from '../src/services/OpenAiGptService.js';
import { OpenAIApi } from 'openai';
import ConfigService from '../src/services/ConfigService.js';
import CliState from '../src/CliState.js';
import SystemMessage from '../src/services/SystemMessage.js';

describe('OpenAiGptService', () => {
  beforeEach(() => {
    CliState.init([], '')
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should return the result from the model', async () => {
    const prompt = 'What is the capital of France?';
    const expectedResult = 'The capital of France is Paris.';
    const model = 'gpt-4';

    const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } });
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { function_call: { arguments: expectedResult } } }
        ]
      }
    });

    const result = await OpenAiGptService.call(prompt, model);

    assert.strictEqual(result, expectedResult);
    sinon.assert.calledOnce(configStub);
    sinon.assert.calledOnce(openaiStub);
  });

  describe('edge cases around OpenAI API responses', () => {
    it('should return null when the response does not contain choices', async () => {
      const prompt = 'What is the capital of France?';
      const model = 'gpt-4';

      const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } });
      const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
        data: {}
      });

      const result = await OpenAiGptService.call(prompt, model);

      assert.strictEqual(result, null);
      sinon.assert.calledOnce(configStub);
      sinon.assert.calledOnce(openaiStub);
    })
  })

  it('should append system messages in the call to openai.createChatCompletion when requestJsonOutput is true', async () => {
    const prompt = 'What is the capital of France?';
    const expectedResult = 'The capital of France is Paris.';
    const model = 'gpt-4';
    const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } })
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { function_call: { arguments: expectedResult } } }
        ]
      }
    });

    await OpenAiGptService.call(prompt, model, true);

    sinon.assert.calledOnce(configStub);
    sinon.assert.calledWith(openaiStub, sinon.match({
      messages: sinon.match.array.deepEquals([
        { role: 'user', content: prompt },
        ...SystemMessage.systemMessages()
      ])
    }));
  });

  it('should not append system messages in the call to openai.createChatCompletion when requestJsonOutput is false', async () => {
    const prompt = 'What is the capital of France?';
    const expectedResult = 'The capital of France is Paris.';
    const model = 'gpt-4';
    const configStub = sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { temperature: 0.5 } })
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { function_call: { arguments: expectedResult } } }
        ]
      }
    });

    await OpenAiGptService.call(prompt, model, false);

    sinon.assert.calledOnce(configStub);
    sinon.assert.calledWith(openaiStub, sinon.match({
      messages: sinon.match.array.deepEquals([
        { role: 'user', content: prompt }
      ])
    }));
  });

  it('should pass the correct model value to openai.createChatCompletion', async () => {
    const prompt = 'What is the capital of France?';
    const expectedResult = 'The capital of France is Paris.';
    const models = ['gpt3', 'gpt4'];
    const expectedModels = ['gpt-3.5-turbo', 'gpt-4o'];

    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { function_call: { arguments: expectedResult } } }
        ]
      }
    });

    for (let i = 0; i < models.length; i++) {
      await OpenAiGptService.call(prompt, models[i]);
      sinon.assert.calledWith(openaiStub.getCall(i), sinon.match({ model: expectedModels[i] }));
    }

    sinon.assert.callCount(openaiStub, models.length);
  });
});