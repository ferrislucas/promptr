import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import RefactorService from './refactorService.js'
import { FileService } from './fileService.js'
import { Command } from 'commander'

export default class PluginService {
  static async call(userInput, args) {
    const program = new Command();
    program.option('-v, --verbose', 'Verbose output');
    program.option('-t, --template <template>', 'Path to template file')
    program.parse(args);
    const verbose = program.opts().verbose;
    const outputFile = program.args.slice(-1)[0]
    if (verbose) console.log(`Output file is: ${outputFile}`)

    let argsExceptLast = program.args.slice(0, -1)
    let prompt = userInput.toString().trim()

    let context = await FileService.load(outputFile)
    if (context?.trim()?.length > 0) {
      let additionalContext = await this.getAdditionalContext(argsExceptLast)
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      let templatePath = path.join(__dirname, 'template.txt')
      const userTemplate = program.opts().template
      if (userTemplate) templatePath = path.join(process.cwd(), userTemplate)
      if (verbose) console.log(`Template path is: ${templatePath}`)
      prompt = await this.loadTemplate(prompt, context, additionalContext, templatePath)
    }
    if (verbose) console.log(`Prompt: \n${prompt}\n\n`)
    await RefactorService.call(prompt, outputFile, verbose)
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

  static async getAdditionalContext(argsExceptLast) {
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

  static shouldLog(args) {
    return args.some(arg => arg === '-v' || arg === '--verbose');
  }
}