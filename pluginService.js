import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import RefactorService from './refactorService.js'
import { FileService } from './fileService.js'
import CliState from './cliState.js'

export default class PluginService {
  static async call(userInput) {
    const verbose = CliState.opts().verbose
    const outputFile = CliState.opts().outputPath
    let prompt = userInput.toString().trim()

    let lastArg = CliState.args.slice(-1)[0]
    let context = await FileService.load(lastArg)
    if (context?.trim()?.length > 0) {
      let additionalContext = await this.getAdditionalContext()
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      let templatePath = path.join(__dirname, 'template.txt')
      const userTemplate = CliState.opts().templatePath
      if (userTemplate) templatePath = path.join(process.cwd(), userTemplate)
      if (verbose) console.log(`Template path is: ${templatePath}`)
      prompt = await this.loadTemplate(prompt, context, additionalContext, templatePath)
    }
    if (verbose) console.log(`Prompt: \n${prompt}\n\n`)
    const output = await RefactorService.call(prompt, outputFile)
    if (outputFile) await FileService.write(output, outputFile)
    else console.log(output)
  }

  static async loadTemplate(prompt, context, additionalContext, templatePath) {
    const templateText = await FileService.load(templatePath)
    const engine = new Liquid()
    const tpl = engine.parse(templateText)
    const content = await engine.render(tpl, {
      additionalContext: additionalContext,
      context: context,
      prompt: prompt,
    })
    return content
  }

  static async getAdditionalContext() {
    let argsExceptLast = CliState.args.slice(0, -1)
    if (argsExceptLast.length === 0) return("")
    let additionalContext = ""
    for (let n = 0; n < argsExceptLast.length; n++) {
      const filename = argsExceptLast[n]
      let s = await FileService.load(path.join(process.cwd(), filename))
      additionalContext = additionalContext.concat(
        `Unit tests in file called "${filename}":\n${s}\n------------------\n\n`
      )
    }
    return additionalContext
  }
}