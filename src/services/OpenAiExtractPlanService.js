import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";

export default class OpenAiExtractPlanService {

  static async call(stepDescription) {
    const model = "gpt-4o-mini"

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)
    
    let messages = [this.systemMessage()]
    messages.push({ role: "user", content: `Here are the steps: \n${stepDescription}` })
    const response = await openai.createChatCompletion({
      model: model,
      temperature: 0.7,
      messages: messages,
      response_format: { "type": "json_object" },
    });

    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message['content']
    if (verbose) console.log(responseBody)
    return responseBody
  }

  static systemMessage() {
    return {
      role: "system",
      content: `You will be presented with a set of steps. Each step should have a description and a verification. Steps may have names or ID's to identify them. Your response should be a json object that represents the steps. The object should look like this: 
      {
        "steps": [
          {
            "name": "Step 1",
            "description": "Step 1 description",
            "verification": "Step 1 verification"
          },
          {
            "name": "Step 2",
            "description": "Step 2 description",
            "verification": "Step 2 verification"
          }
        ]
      }

      If there's an ID or identifier of any kind for a step then the identifier should be used as the value of the "name" key. If there's no identifier then the value of the "name" key should be the step number.`
    }
  }

}
