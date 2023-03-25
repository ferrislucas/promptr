Main.call()

import RefactorService from './refactorService.js'
import readline from 'readline'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

class Main {
  static async call() {
    const args = process.argv.slice(2)
    const lastArgument = args.slice(-1)[0]
    const outputFile = path.join(process.cwd(), lastArgument)
    console.log(`Output file is: ${outputFile}`)

    const argsExceptLast = args.slice(0, -1)

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const preamble = await RefactorService.load(path.join(__dirname, 'preamble.txt'))

    while (true) {
      let userInput = await Main.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\\q") break

      await Main.plugin(userInput, argsExceptLast, outputFile, preamble)
    }
    rl.close()
  }

  static async plugin(userInput, argsExceptLast, outputFile, preamble) {
    let prompt = userInput.toString().trim()

    let additionalContext = await Main.getAdditionalContext(argsExceptLast)
    let context = await RefactorService.load(outputFile)
    if (context?.trim()?.length > 0) {
      prompt = `${preamble} ${additionalContext.length > 0 ? additionalContext : ''} Your instruction is: ${prompt} \n The current source code is: ${context}`
    }
    //console.log(`Prompt: \n${prompt}\n\n`)
    await RefactorService.call(prompt, outputFile, true)
  }

  static async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }

  static async getAdditionalContext(argsExceptLast) {
    let additionalContext = `Here are some unit tests that you need to make pass:\n\n`;
    for (let n = 0; n < argsExceptLast.length; n++) {
      const filename = argsExceptLast[n]
      let s = await RefactorService.load(path.join(process.cwd(), filename))
      additionalContext = additionalContext.concat(
        `Unit tests in file called "${filename}":\n${s}\n------------------\n\n`
      )
    }
    return additionalContext;
  }
}