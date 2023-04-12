import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import { encode } from "gpt-3-encoder"
import Gpt3Service from './gpt3Service.js'
import { FileService } from './fileService.js'
import CliState from './cliState.js'
import Gpt4Service from './gpt4Service.js'
import RefactorResultProcessor from './refactorResultProcessor.js'

export default class PluginService {
  static async call(userInput) {
    const verbose = CliState.verbose()
    const mode = CliState.getMode()
    const outputFile = CliState.getOutputPath()
    let prompt = null
    if (CliState.getMode() != "execute") {
      let context = await this.buildContext(CliState.args)
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      let templatePath = path.join(__dirname, "templates", 'refactor.txt')
      const userTemplate = CliState.getTemplatePath()
      if (userTemplate) {
        templatePath = userTemplate
      }
      if (verbose) console.log(`Template path is: ${templatePath}`)
      
      prompt = await this.loadTemplate(userInput.toString().trim(), context, templatePath)
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

    if (CliState.getTemplatePath() === "refactor") {
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

  static async loadTemplate(prompt, context, template) {
    const templateText = template.startsWith("http://") || template.startsWith("https://") ? 
      await this.loadTemplateFromUrl(template) : 
      await this.loadTemplateFromPath(template)
    const engine = new Liquid()
    engine.registerFilter("jsonToObject", (json) => JSON.parse(json));
    const tpl = engine.parse(templateText)    
    const content = await engine.render(tpl, {
      context: context,
      prompt: prompt,
    })
    return content
  }

  static async loadTemplateFromUrl(templateUrl) {
    const response = await fetch(templateUrl)
    const body = await response.text()
    return body
  }

  static async loadTemplateFromPath(templatePath) {
    if (!templatePath.startsWith("/")) {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)
      templatePath = path.join(__dirname, "templates", `${templatePath}.txt`)
    }
    if (!await FileService.fileExists(templatePath)) {
      console.log(`Template file ${templatePath} does not exist`)
      process.exit(1)
    }
    return await FileService.load(templatePath)
  }
}