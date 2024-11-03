import { describe, it } from 'mocha'
import assert from 'assert';
import CliState from '../src/CliState.js';

describe('CliState', () => {
  it('should initialize and parse options correctly', () => {
    const args = ['node', 'test.js', '-m', 'gpt3', '-p', 'Test prompt', '-v'];
    CliState.init(args);
    const opts = CliState.opts();
    assert.strictEqual(opts.model, 'gpt3');
    assert.strictEqual(opts.prompt, 'Test prompt');
    assert.strictEqual(opts.verbose, true);
  });
});
