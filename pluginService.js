import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import RefactorService from './refactorService.js'
import { FileService } from './fileService.js'

export default class PluginService {
  static async call(userInput, args) {
    const lastArgument = args.slice(-1)[0]
    const outputFile = path.join(process.cwd(), lastArgument)
    if (this.shouldLog(args)) console.log(`Output file is: ${outputFile}`)

    let argsExceptLast = args.slice(0, -1)
    let prompt = userInput.toString().trim()

    let context = await FileService.load(outputFile)
    if (context?.trim()?.length > 0) {
      let additionalContext = await this.getAdditionalContext(argsExceptLast)
      prompt = await this.loadTemplate(prompt, context, additionalContext)
    }
    if (this.shouldLog(args)) console.log(`Prompt: \n${prompt}\n\n`)
    await RefactorService.call(prompt, outputFile, this.shouldLog(args))
  }

  static async loadTemplate(prompt, context, additionalContext) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const templateText = await FileService.load(path.join(__dirname, 'template.txt'))
    const engine = new Liquid()
    const tpl = engine.parse(templateText)
    const content = await engine.render(tpl, {
      additionalContext: additionalContext,
      context: context,
      prompt: prompt,
    })
    return content
  }

  static async getAdditionalContext(argsExceptLast) {
    if (argsExceptLast.length === 0) return("")
    let additionalContext = ""
    for (let n = 0; n < argsExceptLast.length; n++) {
      const filename = argsExceptLast[n]
      if(filename !== "-v" && filename !== "--verbose") {
        let s = await FileService.load(path.join(process.cwd(), filename))
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