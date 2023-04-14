import readline from 'readline'
import PluginService from './services/pluginService.js'
import CliState from './cliState.js'
import fs from 'fs'
import os from 'os'
import path from 'path'

export default class Main {
  
  static async call(argv) {
    CliState.init(argv, await this.getVersion())

    if (argv.length <= 2) {
      console.log("Usage: promptr -m (gpt3|gpt4) <input filepath(s)> -o <output filepath> -p \"Cleanup the code in this file\"");
      return -1
    }

    // Interactive mode
    if (CliState.isInteractive()) {
      await this.loopUntilUserExit()
      return 0
    }

    // Non-interactive mode
    let prompt = CliState.getPrompt() ?? ""
    if (prompt.startsWith('http://') || prompt.startsWith('https://')) {
      const response = await fetch(prompt)
      prompt = await response.text()
    } else if (fs.existsSync(prompt)) {
      prompt = fs.readFileSync(prompt, 'utf-8')
    } else if (prompt.startsWith('~')) {
      const homeDir = os.homedir()
      const filePath = path.join(homeDir, prompt.slice(1))
      if (fs.existsSync(filePath)) {
        prompt = fs.readFileSync(filePath, 'utf-8')
      }
    }
    return await PluginService.call(prompt)
  }

  static async loopUntilUserExit() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    while (true) {
      let userInput = await this.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\q") break

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
    return "3.0.2"
  }
}
