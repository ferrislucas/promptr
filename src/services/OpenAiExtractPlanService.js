import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";

export default class OpenAiExtractPlanService {

  static async call(stepDescription) {
    console.log("Extracting plan...")
    const model = "gpt-4o-mini"

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const verbose = CliState.verbose()
    const openai = new OpenAIApi(configuration)
    
    let messages = [this.systemMessage()]
    messages.push({ role: "user", content: `Here is the plan: \n${stepDescription}` })
    if (verbose) console.log(messages)
    const response = await openai.createChatCompletion({
      model: model,
      temperature: 0.7,
      messages: messages,
      response_format: { "type": "json_object" },
    });

    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message['content']
    if (verbose) console.log(responseBody)
    return JSON.parse(responseBody)
  }

  static systemMessage() {
    return {
      role: "system",
      content: `You will be presented with a goal and a plan to achieve the goal. 
Each step of the plan should have a description and an optional verification. 
Steps may have names or ID's to identify them. 
Your response should be a json object that represents the steps and the goal. 
Don't omit any details when specifying the goal. 
It's extremely important to capture everything the user said when specifying the goal. 
The object should look like this: 
      {
        "goal": "Goal description",
        "summary": "Summary of the plan. List the steps by name and briefly summarize each step.",
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

If there's an ID or identifier of any kind for a step then the identifier should be used as the value of the "name" key. 
If there's no identifier then the value of the "name" key should be the step number.
If there is no plan stated then create a plan to achieve the goal.
If there is no verification for a step then ask the user for verification.`
    }
  }

}
