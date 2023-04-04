import assert from 'assert';
import PluginService from '../pluginService.js';
import { FileService } from '../fileService.js';
import fs from 'fs/promises';

describe('PluginService', () => {
  describe('#call()', () => {
    it('should write the output of GPT3 model prompts to a specified file', async () => {
      const userInput = 'Cleanup the code in this file';
      const outputFile = 'test_output.txt';

      await PluginService.call(userInput, outputFile);

      const output = await fs.readFile(outputFile, 'utf-8');
      assert(output.length > 0, 'Output file should not be empty');

      await fs.unlink(outputFile);
    });

    it('should accept additional arguments that specify one or more files to include in the prompt', async () => {
      const userInput = 'Cleanup the code in this file';
      const outputFile = 'test_output.txt';
      const inputFiles = ['test_input1.txt', 'test_input2.txt'];

      await Promise.all(inputFiles.map(async (file) => {
        await FileService.write('Test content', file);
      }));

      await PluginService.call(userInput, outputFile, inputFiles);

      const output = await fs.readFile(outputFile, 'utf-8');
      assert(output.length > 0, 'Output file should not be empty');

      await Promise.all(inputFiles.map(async (file) => {
        await fs.unlink(file);
      }));
      await fs.unlink(outputFile);
    });
  });
});