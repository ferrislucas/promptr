import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Liquid } from 'liquidjs'
import path from 'path'
import { FileService } from './fileService.js'


class TemplateLoader {
  static async loadTemplate(prompt, context, template) {
    let templateText;
    if (template === 'refactor') {
      templateText = await this.loadTemplateFromUrl('https://gist.githubusercontent.com/ferrislucas/0c9c054133660e4f744e80b685417cfd/raw/6a19ad3f2084c67af4edbcdeb79f2f050433ff67/promptr-refactor-template-v3.0.2');
    } else if (template === 'empty') {
      templateText = await this.loadTemplateFromUrl('https://gist.githubusercontent.com/ferrislucas/e43ce36b49f37efe28e7414de4b71399/raw/7ef0afd5a094d392c255d7c0a98f6572dfc4bece/promptr-empty-template-v3.0.2');
    } else if (template === 'swe') {
      templateText = await this.loadTemplateFromUrl('https://gist.githubusercontent.com/ferrislucas/a6a18fdafe32910c95829a700c0887ed/raw/50e533d2db8e7e138bfa925739e5e1f5c4498e95/promptr-swe-template-v3.0.2');
    } else if (template === 'test-first') {
      templateText = await this.loadTemplateFromUrl('https://gist.githubusercontent.com/ferrislucas/5d38034e1eefaec0a3d32bdbca3a9ac6/raw/48f1a47d179f568cf1d1fa9271d5ad13fbdc3c85/promptr-test-first-template-v3.0.2');
    } else {
      templateText = template.startsWith('http://') || template.startsWith('https://') ? 
        await this.loadTemplateFromUrl(template) : 
        await this.loadTemplateFromPath(template);
    }
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
      throw new Error(`Template file ${templatePath} does not exist`)
    }
    return await FileService.load(templatePath)
  }
}

export default TemplateLoader;