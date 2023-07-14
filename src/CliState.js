import { Command } from 'commander'

export default class CliState {
  program = null
  args = null

  static init(_args, version) {
    this.program = new Command();
    this.program.option('-d, --dry-run', 'Dry run only: just display the prompt')
    this.program.option('-i, --interactive', 'Interactive mode')
    this.program.option('-x, --execute', 'Apply changes suggested by GPT to the local filesystem. The "refactor" template auotmatically applies the changes. You would only use this option if you create your own templates.')
    this.program.option('-p, --prompt <prompt>', 'Prompt to use in non-interactive mode')
    this.program.option('-t, --template <template>', 'Teplate name, template path, or a url for a template file')
    this.program.option('-o, --output-path <outputPath>', 'Path to output file. If no path is specified, output will be printed to stdout.')
    this.program.option('-v, --verbose', 'Verbose output')
    this.program.option('-m, --model <model>', 'Specify the model to use', 'gpt4')
    this.program.option('-dac, --disable-auto-context', 'Prevents files referenced in the prompt from being automatically included in the context sent to the model.');
    
    this.program.version(version, '--version', 'Display the current version')
    
    this.program.addHelpText('after', `

Example call:
  $ promptr index.js -p "Cleanup the code in this file"`);

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

  static getModel() {
    return this.program.opts().model
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

  static disableAutoContext() {
    return !!this.program.opts().disableAutoContext
  }

}
