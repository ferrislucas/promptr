import { Command } from 'commander'

export default class CliState {
  program = null
  args = null

  static init(_args) {
    this.program = new Command();
    this.program.option('-d, --dry-run', 'Dry run only: just display the prompt')
    this.program.option('-i, --interactive', 'Interactive mode');
    this.program.option('-p, --prompt <prompt>', 'Prompt to use in non-interactive mode');
    this.program.option('-t, --template-path <templatePath>', 'Path to template file')
    this.program.option('-o, --output-path <outputPath>', 'Path to output file. If no path is specified, output will be printed to stdout.')
    this.program.option('-v, --verbose', 'Verbose output')
    this.program.requiredOption('-m, --mode <mode>', 'Specify the mode: (gpt3|gpt4)')
    this.program.addHelpText('after', `
Example call:
  $ promptr -m gpt3 index.js -o index.js -p "Cleanup the code in this file"`);

    this.program.parse(_args);
    this.args = this.program.args
  }

  static opts() {
    return this.program.opts()
  }

  static verbose() {
    return this.program.opts().verbose
  }
}
