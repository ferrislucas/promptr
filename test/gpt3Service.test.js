import assert from 'assert';
import sinon from 'sinon';
import Gpt3Service from '../src/services/gpt3Service.js';
import { Configuration, OpenAIApi } from 'openai';
import CliState from '../src/cliState.js'

describe('Gpt3Service', () => {

  it('should call the OpenAIApi with the correct config', async () => {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const expectedResult = 'This is my response'
    CliState.init([], '')
    const openaiStub = sinon.stub(OpenAIApi.prototype, 'createChatCompletion').resolves({
      data: {
        choices: [
          { message: { content: expectedResult } }
        ]
      }
    });

    const result = await Gpt3Service.call('This is my prompt');
    
    assert.equal(result, expectedResult);

    openaiStub.restore()
  });

});