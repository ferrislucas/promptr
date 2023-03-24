import RefactorService from './refactorService.js'
import readline from 'readline'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

export default class {
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

    const context = await RefactorService.load(outputFile)
  
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const preamble = await RefactorService.load(path.join(__dirname, 'preamble.txt'))

    while (true) {
      let userInput = await new Promise(resolve => {
        rl.question('promptr# ', _input => {
          resolve(_input)
        })
      })
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\\q") break

      let prompt = userInput.toString().trim();

      let additionalContext = `Here are some unit tests that you need to make pass:\n\n`;
      for (let n = 0; n < argsExceptLast.length; n++) {
        const filename = argsExceptLast[n]
        let s = await RefactorService.load(path.join(process.cwd(), filename))
        additionalContext = additionalContext.concat(
          `Unit tests in file called "${filename}":\n${s}\n------------------\n\n`
        )
      }

      if (context?.trim()?.length > 0) {
        prompt = `${preamble} ${
          additionalContext.length > 0 ? additionalContext : ''
        } Your instruction is: ${prompt} \n The current source code is: ${context}`;
      }
      //console.log(prompt)
      await RefactorService.call(prompt, outputFile)
    }
    rl.close()
  }
}