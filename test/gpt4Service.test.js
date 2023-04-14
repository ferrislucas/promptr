import assert from 'assert';
import Gpt4Service from '../src/services/gpt4Service.js';

describe('Gpt4Service', () => {
  it('should extract source code correctly', () => {
    const input = 'Updated source code:\n// Your code\n-------\nconst example = 1;';
    const expected = 'const example = 1;';
    const result = Gpt4Service.extractSourceCode(input);
    assert.strictEqual(result, expected);
  });
});