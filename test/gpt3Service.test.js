import assert from 'assert';
import Gpt3Service from '../src/services/gpt3Service.js';

describe('Gpt3Service', () => {
  it('should extract source code correctly', () => {
    const input = 'Updated source code:\n// Your code\n-------\nconst example = 1;';
    const expected = 'const example = 1;';
    const result = Gpt3Service.extractSourceCode(input);
    assert.strictEqual(result, expected);
  });
});