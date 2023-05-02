import assert from 'assert';
import sinon from 'sinon';
import Gpt3Service from '../src/services/gpt3Service.js';
import { Configuration, OpenAIApi } from 'openai';
import ConfigService from '../src/services/configService.js';
import { encode } from "gpt-3-encoder"
import CliState from '../src/cliState.js'

describe('Gpt3Service', () => {

  it('should call the OpenAIApi with the correct config', async () => {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    CliState.init([], '')
    const config = await ConfigService.retrieveConfig();
    const encoded = encode('This is my prompt');
    const promptLength = encoded.length;
    const apiConfig = {
      ...config.api,
      prompt: 'This is my prompt',
      max_tokens: (4096 - promptLength),
    }
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createCompletion').returns({
      data: {
        choices: [
          { text: 'This is my response' }
        ]
      }
    })

    const result = await Gpt3Service.call('This is my prompt');
    openaiStub.restore()
    assert.equal(result, 'This is my response');
  });

});