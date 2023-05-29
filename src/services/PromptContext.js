import { FileService } from './fileService.js'

export default class PromptContext {
  static async call(args) {
    let context = { 
      files: [],
    }
    for (let n = 0; n < args.length; n++) {
      const fileContent = await FileService.load(args[n]);
      if (fileContent !== null) {
        context.files.push({
          filename: args[n],
          content: fileContent,
        })
      }
    }
    return context
  }
}
