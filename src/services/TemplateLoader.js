import { Liquid } from 'liquidjs'
import path from 'path'
import { FileService } from './FileService.js'
import TemplateUrl from './TemplateUrl.js'

class TemplateLoader {
  static async loadTemplate(prompt, context, template) {
    let templateText
    if (template === 'refactor') {
      templateText = await this.loadTemplateFromUrl(TemplateUrl.refactor)
    } else if (template === 'empty') {
      templateText = await this.loadTemplateFromUrl(TemplateUrl.empty)
    } else if (template === 'swe') {
      templateText = await this.loadTemplateFromUrl(TemplateUrl.swe)
    } else if (template === 'test-first') {
      templateText = await this.loadTemplateFromUrl(TemplateUrl.testFirst)
    } else {
      templateText = template.startsWith('http://') || template.startsWith('https://') ? 
        await this.loadTemplateFromUrl(template) : 
        await this.loadTemplateFromPath(template)
    }
    const engine = new Liquid()
    engine.registerFilter("jsonToObject", (json) => JSON.parse(json))
    const tpl = engine.parse(templateText)    
    const content = await engine.render(tpl, {
      context: context,
      prompt: prompt
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
      templatePath = path.join(process.cwd(), `${templatePath}`)
    }
    if (!await FileService.fileExists(templatePath)) {
      throw new Error(`Template file ${templatePath} does not exist`)
    }
    return await FileService.load(templatePath)
  }
}

export default TemplateLoader;