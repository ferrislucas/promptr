import readline from 'readline'
import PluginService from './pluginService.js'
import CliState from './cliState.js'

export default class Main {
  
  static async call() {
    CliState.init(process.argv, await this.getVersion())

    if (process.argv.length <= 2) {
      console.log("Usage: promptr -m (gpt3|gpt4) <input filepath(s)> -o <output filepath> -p \"Cleanup the code in this file\"");
      process.exit(-1);
    }

    // Interactive mode
    if (CliState.isInteractive()) {
      await this.loopUntilUserExit()
      process.exit(0);
    }

    // Non-interactive mode
    const prompt = CliState.getPrompt()
    if (!prompt && CliState.getMode() != "execute") {
      console.log("No prompt was specified. Please specify a prompt with the --prompt option, or use interactive mode by using the --interactive option.");
      process.exit(-1);
    }
    await PluginService.call(prompt)
    process.exit(0)
  }

  static async loopUntilUserExit() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    while (true) {
      let userInput = await this.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\\q") break

      await PluginService.call(userInput)
    }
    rl.close()
  }

  static async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }

  static async getVersion() {
    return "1.1.7"
  }
}