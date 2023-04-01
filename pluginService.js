import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import Gpt3Service from './gpt3Service.js'
import { FileService } from './fileService.js'
import CliState from './cliState.js'
import Gpt4Service from './gpt4Service.js'

export default class PluginService {
  static async call(userInput) {
    const verbose = CliState.opts().verbose
    const mode = CliState.opts().mode
    const outputFile = CliState.opts().outputPath
    let prompt = userInput.toString().trim()
    let context = await this.buildContext(CliState.args)
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    let templatePath = path.join(__dirname, "templates", 'empty.txt')
    const userTemplate = CliState.opts().templatePath
    if (userTemplate) {
      templatePath = userTemplate
      if (!templatePath.startsWith("/")) {
        templatePath = path.join(__dirname, "templates", `${templatePath}.txt`)
      }
    } 
    if (verbose) console.log(`Template path is: ${templatePath}`)
    
    prompt = await this.loadTemplate(prompt, context, templatePath)
    if (verbose) console.log(`Prompt: \n${prompt}\n\n`)
    
    if (CliState.opts().dryRun) {
      console.log(prompt)
      process.exit(0)
    }

    const output = await this.executeMode(mode, prompt)
    if (outputFile) await FileService.write(output, outputFile)
    else console.log(output)
  }

  static async executeMode(mode, prompt) {
    if (mode != "gpt3" && mode != "gpt4") {
      console.log(`Mode ${mode} is not supported`)
      process.exit(1)
    }
    if (mode === "gpt3") {
      return await Gpt3Service.call(prompt)
    }
    if (mode === "gpt4") {
      return await Gpt4Service.call(prompt)
    }
    console.log(`Mode "${mode}" is not supported`)
    exit(1)
  }

  static async buildContext(args) {
    let context = { }
    for (let n = 0; n < args.length; n++) {
      const arg = args[n]
      const filename = arg
      const fileContent = await FileService.load(filename)
      context[filename] = fileContent
    }
    return context
  }

  static async loadTemplate(prompt, context, templatePath) {
    if (!await FileService.fileExists(templatePath)) {
      console.log(`Template file ${templatePath} does not exist`)
      process.exit(1)
    }
    const templateText = await FileService.load(templatePath)
    const engine = new Liquid()
    engine.registerFilter("jsonToObject", (json) => JSON.parse(json));
    const tpl = engine.parse(templateText)    
    const content = await engine.render(tpl, {
      context: context,
      prompt: prompt,
    })
    return content
  }
}