import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";
import ConfigService from "./ConfigService.js"
import { encode } from "gpt-3-encoder"
import SystemMessage from "./SystemMessage.js";

export default class OpenAiGptService {

  static async call(prompt, model, requestJsonOutput = true) {
    if (model == "gpt3") model = "gpt-3.5-turbo";
    if (model == "gpt4") model = "gpt-4o";

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)
    
    const config = await ConfigService.retrieveConfig();
    const encoded = encode(prompt)
    const messages = requestJsonOutput ? [{role: "user", content: prompt }, ...SystemMessage.systemMessages()] : [{role: "user", content: prompt }]
    if (verbose) console.log(`Prompt token count: ${encoded.length}\n\nMessages sent to the OpenAI API:\n${messages.map(m => `\n${m.role}\n--------\n${m.content}`).join("\n================\n\n")}\n\n`)
    const response = await openai.createChatCompletion({
      model: model,
      temperature: config.api.temperature,
      messages: messages,
      functions: [{
        name: "crud_operations",
        description: "Create, update, or delete one or more files",
        parameters: {
          "type": "object",
          "properties": {
            "operations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "crudOperation": {
                    "type": "string",
                    "enum": ["create", "read", "update", "delete"]
                  },
                  "filePath": {
                    "type": "string"
                  },
                  "fileContents": {
                    "type": "string"
                  }
                },
                "required": ["crudOperation", "filePath", "fileContents"]
              }
            }
          }
        }
      }],
      function_call: { "name": "crud_operations" }
    });

    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message.function_call.arguments
    if (verbose) console.log(responseBody)
    return responseBody
  }

}