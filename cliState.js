import { Command } from 'commander'

export default class CliState {
  program = null
  args = null

  static init(_args, version) {
    this.program = new Command();
    this.program.option('-d, --dry-run', 'Dry run only: just display the prompt')
    this.program.option('-i, --interactive', 'Interactive mode');
    this.program.option('-x, --execute', 'Execute: apply changes from gpt to local filesystem (refactor template only)');
    this.program.option('-p, --prompt <prompt>', 'Prompt to use in non-interactive mode');
    this.program.option('-t, --template <template>', 'Teplate name, template path, or a url for a template file')
    this.program.option('-o, --output-path <outputPath>', 'Path to output file. If no path is specified, output will be printed to stdout.')
    this.program.option('-v, --verbose', 'Verbose output')
    this.program.option('-m, --mode <mode>', 'Specify the mode: (gpt3|gpt4)', 'gpt3')
    
    this.program.version(version, '--version', 'Display the current version')
    
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

  static version() {
    return this.program.opts().version
  }

  static getMode() {
    return this.program.opts().mode
  }

  static getExecuteFlag() {
    return this.program.opts().execute
  }

  static getOutputPath() {
    return this.program.opts().outputPath
  }

  static getTemplatePath() {
    return this.program.opts().template
  }

  static getPrompt() {
    return this.program.opts().prompt
  }

  static isDryRun() {
    return this.program.opts().dryRun
  }

  static isInteractive() {
    return this.program.opts().interactive
  }

  static getExecutePath() {
    return this.program.opts().execute
  }

}
