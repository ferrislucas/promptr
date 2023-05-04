import { Configuration, OpenAIApi } from "openai"
import CliState from "../cliState.js";
import ConfigService from "./configService.js"
import { encode } from "gpt-3-encoder"

export default class Gpt4Service {
  static async call(prompt, model) {
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
      model: model,
      temperature: config.api.temperature,
      messages: [{role: "user", content: prompt }, ...systemMessages],
    });

    if (!response?.data?.choices) return null
    let result = response.data.choices.map((d) => d?.message?.content?.trim()).join()
    if (verbose) console.log(`--Response--\n${result}`)
    return result
  }

  static systemMessages() {
    return [{ role: "system", content: `Your response should be entirely valid json with no other content outside of the json.
Your reponse should be able to be parsed as json.
Respond with valid json only. 
Do not include file contents or any other words before or after the json.
Do not respond with anything but json.
The json should be an object with an "operations" key. 
The "operations" key should be array of objects. 
Each object should represent a file that should be created, updated, or deleted. 
Each object should have three keys: "crudOperation", "filePath", and "fileContents".
The "crudOperation" value should contain the operation that you would like to perform for the given file. The "crudOperation" value should be "create", "update", or "delete".
The "filePath" value should contain the path to the file. 
The "fileContents" value should be the contents of the file if the file is being created or updated - if the file is being deleted then the "fileContents" key can be omitted.
Make sure that the "fileContents" value is delimitted correctly as a json string.
Your json response must always be valid json.
Only include changed files in your response. 
Don't abbreviate file contents - include the whole file for the "fileContents" value.` }];
  }
}