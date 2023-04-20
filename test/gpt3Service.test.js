import assert from 'assert';
import sinon from 'sinon';
import Gpt3Service from '../src/services/gpt3Service.js';
import { Configuration, OpenAIApi } from 'openai';
import ConfigService from '../src/services/configService.js';

describe('Gpt3Service', () => {
  it('should extract source code correctly', () => {
    const input = 'Updated source code:\n// Your code\n-------\nconst example = 1;';
    const expected = 'const example = 1;';
    const result = Gpt3Service.extractSourceCode(input);
    assert.strictEqual(result, expected);
  });

  it('should return the expected result', async () => {
    const prompt = 'Test prompt';
    const expected = 'const testResult = 1;';

    sinon.stub(ConfigService, 'retrieveConfig').resolves({ api: { someConfig: 'value' } });
    sinon.stub(OpenAIApi.prototype, 'createCompletion').resolves({
      data: {
        choices: [{ text: '\nThe response should be:\n// Your code\n-------\nconst testResult = 1;' }]
      }
    });

    const result = await Gpt3Service.call(prompt);
    assert.strictEqual(result, expected);

    ConfigService.retrieveConfig.restore();
    OpenAIApi.prototype.createCompletion.restore();
  });
});