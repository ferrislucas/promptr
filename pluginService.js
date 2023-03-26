import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import RefactorService from './refactorService.js'

export default class PluginService {
  static async call(userInput, args) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const preamble = await RefactorService.load(path.join(__dirname, 'preamble.txt'))

    const lastArgument = args.slice(-1)[0]
    const outputFile = path.join(process.cwd(), lastArgument)
    if (this.shouldLog(args)) console.log(`Output file is: ${outputFile}`)

    let argsExceptLast = args.slice(0, -1)
    let prompt = userInput.toString().trim()

    let additionalContext = await this.getAdditionalContext(argsExceptLast)
    let context = await RefactorService.load(outputFile)
    if (context?.trim()?.length > 0) {
      prompt = `${preamble} ${additionalContext.length > 0 ? additionalContext : ''} Your instruction is: ${prompt} \n The current source code is: ${context}\n\n`
    }
    if (this.shouldLog(args)) console.log(`Prompt: \n${prompt}\n\n`)
    await RefactorService.call(prompt, outputFile, this.shouldLog(args))
  }

  static async getAdditionalContext(argsExceptLast) {
    if (argsExceptLast.length === 0) return("")
    let additionalContext = `Here are some unit tests that you need to make pass:\n\n`
    for (let n = 0; n < argsExceptLast.length; n++) {
      const filename = argsExceptLast[n]
      if(filename !== "-v" && filename !== "--verbose") {
        let s = await RefactorService.load(path.join(process.cwd(), filename))
        additionalContext = additionalContext.concat(
          `Unit tests in file called "${filename}":\n${s}\n------------------\n\n`
        )
      }
    }
    return additionalContext
  }

  static shouldLog(args) {
    return args.some(arg => arg === '-v' || arg === '--verbose');
  }
}