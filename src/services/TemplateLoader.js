import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import path from 'path'
import { FileService } from './fileService.js'


class TemplateLoader {
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
      templatePath = path.join(__dirname, "../../templates", `${templatePath}.txt`)
    }
    if (!await FileService.fileExists(templatePath)) {
      console.log(`Template file ${templatePath} does not exist`)
      process.exit(1)
    }
    return await FileService.load(templatePath)
  }
}

export default TemplateLoader;