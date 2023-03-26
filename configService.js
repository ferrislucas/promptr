import { FileService } from "./fileService.js";

export default class ConfigService {
static async retrieveConfig() {
    const config = { model: "text-davinci-003", temperature: 0.5 };
    const userHomeDir = process.env.HOME;
    const configPath = `${userHomeDir}/.promptr.json`;
    const fileExists = await FileService.fileExists(configPath)
    if (fileExists) {
      try {
        const data = await fs.promises.readFile(configPath, "utf-8")
        return JSON.parse(data);
      } catch (err) {
        this.log(err)
        return config;
      }
    }
    return config;
  }
}