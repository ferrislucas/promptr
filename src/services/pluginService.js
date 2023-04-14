import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { encode } from "gpt-3-encoder"
import Gpt3Service from './gpt3Service.js'
import { FileService } from './fileService.js'
import CliState from '../cliState.js'
import Gpt4Service from './gpt4Service.js'
import RefactorResultProcessor from './refactorResultProcessor.js'
import TemplateLoader from './templateLoader.js'

export default class PluginService {
  
  static async call(userInput) {
    const verbose = CliState.verbose()
    const mode = CliState.getMode()
    const outputFile = CliState.getOutputPath()
    let prompt = null
    if (CliState.getTemplatePath() === "refactor" && CliState.getOutputPath()) {
      console.log("The \"refactor\" template cannot be used with the --output option.")
      return 1
    }
    if (CliState.getMode() != "execute") {
      let context = await this.buildContext(CliState.args)
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      let templatePath = "refactor"
      const userTemplate = CliState.getTemplatePath()
      if (userTemplate) {
        templatePath = userTemplate
      }
      if (verbose) console.log(`Template path is: ${templatePath}`)
      
      prompt = await TemplateLoader.loadTemplate(userInput.toString().trim(), context, templatePath)
      if (verbose) console.log(`Prompt: \n${prompt}\n\n`)
      
      if (CliState.isDryRun()) {
        console.log(prompt)
        console.log(`Prompt token count: ${encode(prompt).length}`)
        return
      }
    }
    
    const output = await this.executeMode(mode, prompt)
    if (outputFile) {
      await FileService.write(output, outputFile)
      return 0
    }

    if (CliState.getTemplatePath() === "refactor" || !CliState.getTemplatePath()) {
      if (verbose) console.log(`Executing: \n${output}\n\n`)
      const operations = JSON.parse(output)
      if (CliState.isDryRun()) {
        console.log(operations)
        return 0
      }
      await RefactorResultProcessor.call(operations)
      return 0
    }

    console.log(output)
    return 0
  }

  static async processPipedInput() {
    const pipedJson = await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
    const operations = JSON.parse(pipedJson)
    return await RefactorResultProcessor.call(operations)
  }

  static async executeMode(mode, prompt) {
    if (mode != "gpt3" && mode != "gpt4" && mode != "execute") {
      console.log(`Mode ${mode} is not supported`)
      process.exit(1)
    }
    if (mode === "execute") {
      process.stdin.setEncoding('utf8')
      await this.processPipedInput()
      return "Changes applied"
    }
    if (mode === "gpt3") {
      return await Gpt3Service.call(prompt)
    }
    if (mode === "gpt4") {
      return await Gpt4Service.call(prompt)
    }
    console.log(`Mode ${mode} is not supported`)
    exit(1)
  }

  static async buildContext(args) {
    let context = { 
      files: [],
    }
    for (let n = 0; n < args.length; n++) {
      context.files.push({
        filename: args[n],
        content: await FileService.load(args[n]),
      })
    }
    return context
  }
}
