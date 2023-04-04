import assert from 'assert';
import Main from '../main.js';

describe('Main', () => {
  it('should get user input correctly', async () => {
    const rlMock = {
      question: (prompt, callback) => {
        callback('test input');
      }
    };
    const result = await Main.getUserInput(rlMock);
    assert.strictEqual(result, 'test input');
  });
});