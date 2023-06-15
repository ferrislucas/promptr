import { Liquid } from 'liquidjs'
import path from 'path'
import { FileService } from './FileService.js'

class TemplateLoader {
  static async loadTemplate(prompt, context, template) {
    let templateText = this.getTemplateText(template)
    if (!templateText) {
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

  static getTemplateText(template) {
    if (template === 'refactor') {
      return `{{prompt}}
{% if context.files.size > 0 %}
###
The following are file paths and content related to this request.
Each file begins with "File: " followed by the file path and file content.
{% endif %}
{% for item in context.files %}
File: {{ item.filename }} """
{{ item.content }}
"""
{% endfor %}`
    } 

    if (template === 'empty') {
      return `{% if context.files.size > 0 %}You will be provided the contents of some files.
The contents of each file begin with "--BEGIN-FILE:" followed by the file path.
The contents of each file end with "--END-FILE--".{% endif %}

Your instructions are: {{prompt}}
{% if context.files.size > 0 %}The file contents are below:{% endif %}
{% for item in context.files %}
--BEGIN-FILE: {{ item.filename }}
{{ item.content }}
--END-FILE--
{% endfor %}`
    }
    
    if (template === 'swe') {
      return `You are a software engineer. 
You receive one instruction at a time. 
You will be given the source code of the current file at the end of each instruction.
You are to follow the instruction by applying changes to the source code you are given.
Respond with the source code only. Your response should only contain valid syntactically correct source code.
Do not preface your response with anything.

{% if context.files.size > 0 %}
You will be provided the contents of some files.
The contents of each file begin with "--BEGIN-FILE:" followed by the file path.
The contents of each file end with "--END-FILE--".
{% endif %}

Produce the source code to accomplish this instruction: {{prompt}}

{% if context.files.size > 0 %}
The codebase files and content are below:
{% endif %}
{% for item in context.files %}
--BEGIN-FILE: {{ item.filename }}
{{ item.content }}
--END-FILE--
{% endfor %}`
    } 
    
    if (template === 'test-first') {
      return `You are to follow the instruction by applying changes to the source code you are given.
Respond with the source code only. Your response should only contain valid syntactically correct source code.
Do not preface your response with anything.
Always leave existing code intact unless instructed not to.

You will be provided the contents of some files from a codebase.
The contents of each file begin with "--BEGIN-FILE:" followed by the file path.
The contents of each file end with "--END-FILE--".

Produce an implementation of the class described in the first file that will pass the unit tests specified in the other files: 
{{prompt}}

{% for item in context.files %}
--BEGIN-FILE: {{ item.filename }}
{{ item.content }}
--END-FILE--
{% endfor %}`
    }
    return null
  }
}

export default TemplateLoader;