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
    const prompt = CliState.getPrompt() ?? ""
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
    return "2.0.3"
  }
}