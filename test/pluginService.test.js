import assert from 'assert';
import PluginService from '../pluginService.js';

describe('PluginService', () => {
  it('should build context correctly', async () => {
    const args = ['testFile1.js', 'testFile2.js'];
    const expected = {
      'testFile1.js': 'const example1 = 1;',
      'testFile2.js': 'const example2 = 2;'
    };
    const result = await PluginService.buildContext(args);
    assert.deepStrictEqual(result, expected);
  });
});