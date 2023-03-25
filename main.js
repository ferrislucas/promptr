import readline from 'readline'
import PluginService from './pluginService.js'

export default class Main {
  
  static async call() {
    const args = process.argv.slice(2)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    while (true) {
      let userInput = await this.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\\q") break

      await PluginService.plugin(userInput, args)
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

}