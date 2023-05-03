import { Configuration, OpenAIApi } from "openai"
import CliState from "../cliState.js";
import ConfigService from "./configService.js"
import { encode } from "gpt-3-encoder"

export default class Gpt4Service {
  static async call(prompt) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)
    
    const config = await ConfigService.retrieveConfig();
    const encoded = encode(prompt)
    if (verbose) console.log(`Prompt token count: ${encoded.length}`)
    const systemMessages = Gpt4Service.systemMessages();
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      temperature: config.api.temperature,
      messages: [{role: "user", content: prompt }, ...systemMessages],
    });

    if (!response?.data?.choices) return null
    let result = response.data.choices.map((d) => d?.message?.content?.trim()).join()
    if (verbose) console.log(`--Response--\n${result}`)
    return result
  }

  static systemMessages() {
    return [{ role: "system", content: "system" }];
  }
}