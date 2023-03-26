import fs from 'fs'

export class FileService {
  static async write(data, filePath) {
    await fs.promises.writeFile(filePath, data)
  }

  static async load(filePath) {
    const fileDoesNotExist = !await this.fileExists(filePath)
    if (fileDoesNotExist) return("")
    try {
      // Use the fs module to read the file
      const data = await fs.promises.readFile(filePath, "utf-8")
      return data
    } catch (err) {
      this.log(err)
      return("")
    }
  }

  static async fileExists(filePath) {
    return fs.existsSync(filePath)
  }

  static log(message) {
    console.log(message)
  }
}