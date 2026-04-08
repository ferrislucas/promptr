import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";
import ConfigService from "./ConfigService.js"
import { encode } from "gpt-3-encoder"
import SystemMessage from "./SystemMessage.js";

export default class OpenAiGptService {

  static isMiniMaxModel(model) {
    return model.toLowerCase().startsWith("minimax");
  }

  static async call(prompt, model, requestJsonOutput = true) {
    if (model == "gpt3") model = "gpt-3.5-turbo";
    if (model == "gpt4") model = "gpt-4o";
    if (model == "minimax") model = "MiniMax-M2.7";
    if (model == "minimax-highspeed") model = "MiniMax-M2.7-highspeed";

    const isMiniMax = this.isMiniMaxModel(model);
    const configuration = new Configuration({
      apiKey: isMiniMax ? process.env.MINIMAX_API_KEY : process.env.OPENAI_API_KEY,
      basePath: isMiniMax
        ? (process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1")
        : (process.env.OPENAI_API_BASE || "https://api.openai.com/v1")
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)

    const config = await ConfigService.retrieveConfig();
    // MiniMax requires temperature in (0.0, 1.0]; clamp to 1.0 if out of range
    const temperature = isMiniMax
      ? Math.min(Math.max(config.api.temperature || 1.0, 0.01), 1.0)
      : config.api.temperature;
    const encoded = encode(prompt)
    // MiniMax requires system messages before user messages
    const messages = requestJsonOutput
      ? (isMiniMax
          ? [...SystemMessage.systemMessages(), {role: "user", content: prompt }]
          : [{role: "user", content: prompt }, ...SystemMessage.systemMessages()])
      : [{role: "user", content: prompt }]
    if (verbose) console.log(`Prompt token count: ${encoded.length}\n\nMessages sent to the OpenAI API:\n${messages.map(m => `\n${m.role}\n--------\n${m.content}`).join("\n================\n\n")}\n\n`)

    const crudFunctionDef = {
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
    };

    // MiniMax supports the modern tools API (not legacy functions API)
    const requestParams = isMiniMax
      ? {
          model: model,
          temperature: temperature,
          messages: messages,
          tools: [{ type: "function", function: crudFunctionDef }],
          tool_choice: { type: "function", function: { name: "crud_operations" } }
        }
      : {
          model: model,
          temperature: temperature,
          messages: messages,
          functions: [crudFunctionDef],
          function_call: { "name": "crud_operations" }
        };

    const response = await openai.createChatCompletion(requestParams);

    if (!response?.data?.choices) return null
    const choice = response.data.choices[0].message
    const responseBody = isMiniMax
      ? choice.tool_calls?.[0]?.function?.arguments
      : choice.function_call?.arguments
    if (verbose) console.log(responseBody)
    return responseBody
  }

}
