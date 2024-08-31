import { OpenAI } from "openai"
import CliState from "../CliState.js";

export default class OpenAiExtractPlanService {

  static async call(stepDescription) {
    console.log("Goal planning...")

    const verbose = CliState.verbose()
    const openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1"})
    
    let messages = [this.systemMessage()]
    messages.push({ role: "user", content: `Here is the plan: \n${stepDescription}` })
    if (verbose) console.log(messages)
    const response = await openai.chat.completions.create({
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      messages: messages,
      response_format: { "type": "json_object" },
    });

    const responseBody = response.choices[0].message.content
    return JSON.parse(responseBody)
  }

  static systemMessage() {
    return {
      role: "system",
      content: `You will be presented with a goal. You may also be given a plan and/or ground truths. 
Each step of the plan should have a description and an optional verification. 
Steps may have names or ID's to identify them. 
Your response should be a json object that represents the steps and the goal. 
Don't omit any details when specifying the goal. 
It's extremely important to capture everything the user said when specifying the goal. 
Here's an example of the json object you might return - stick to this structure: 
      {
        "goal": "Goal description",
        "summary": "Summary of the plan. List the steps by name and briefly summarize each step.",
        "groundTruths": ["An important fact", "Another important fact"],
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
If there is no plan stated then create a plan to achieve the goal.`
    }
  }

}
