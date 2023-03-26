import readline from 'readline'
import PluginService from './pluginService.js'

export default class Main {
  
  static async call() {
    if (process.argv.length <= 2) {
      console.log("Usage: promptr [<input path 1> <input path 2> ...] <output path>");
      process.exit(-1);
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    while (true) {
      let userInput = await this.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\\q") break

      await PluginService.call(userInput, process.argv)
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