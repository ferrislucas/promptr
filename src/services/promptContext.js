import { FileService } from './fileService.js'

export default class PromptContext {
  static async call(args) {
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
