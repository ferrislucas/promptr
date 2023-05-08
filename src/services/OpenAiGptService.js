import { Configuration, OpenAIApi } from "openai"
import CliState from "../cliState.js";
import ConfigService from "./configService.js"
import { encode } from "gpt-3-encoder"
import SystemMessage from "./systemMessage.js";

export default class OpenAiGptService {

  static async call(prompt, model) {
    if (model == "gpt3") model = "gpt-3.5-turbo";
    if (model == "gpt4") model = "gpt-4";

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)
    
    const config = await ConfigService.retrieveConfig();
    const encoded = encode(prompt)
    if (verbose) console.log(`Prompt token count: ${encoded.length}`)
    const response = await openai.createChatCompletion({
      model: model,
      temperature: config.api.temperature,
      messages: [{role: "user", content: prompt }, ...SystemMessage.systemMessages()],
    });

    if (!response?.data?.choices) return null
    let result = response.data.choices.map((d) => d?.message?.content?.trim()).join()
    if (verbose) console.log(`--Response--\n${result}`)
    return result
  }

}