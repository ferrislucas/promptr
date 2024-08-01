import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'
import SystemMessage from "./SystemMessage.js";

export default class StepExecutor {
  constructor(plan, step) {    
    this.messages = [SystemMessage.stepExecutorSystemMessage()]
    this.plan = plan
    this.step = step
    this.stepPlan = null
  }

  async call() {
    const prompt = `The goal is: ${this.plan.goal}
The plan summary is: ${this.plan.summary}

You are currently working on this step in the plan:
Step: ${this.step.name}

Description: ${this.step.description}

Verification: ${this.step.verification}`

    this.messages.push({ role: "user", content: prompt })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    let stepPlan = await this.buildStepPlan(prompt)
    if (CliState.verbose()) {
      console.log(`Step plan:`)
      console.log(stepPlan)
      console.log(`-- End step plan --`)
    }

    this.messages.push({ role: "assistant", content: `${stepPlan}` })

    let loopCount = 0
    let modelAction = null
    // loop until the model calls the step_verified function
    do {
      loopCount++
      
      modelAction = await this.retrieveActionFromModel()
      let functionArgs = null
      try {
        functionArgs = JSON.parse(modelAction.arguments)  
      } catch (error) {
        console.error(error)
        continue
      }

      if (CliState.verbose()) console.log(`Function: ${modelAction.name}`)
      if (CliState.verbose()) console.log(functionArgs)
      
      if (modelAction.name == "step_verified") {
        console.log(`${functionArgs.step_name} verified as complete. \n\nReasoning: ${functionArgs.reasoning}`)
        break
      }
      if (modelAction.name == "take_note_of_something_important") {
        this.messages.push({ role: "assistant", content: `The following information has been committed to memory: ${functionArgs.informationToRemember} \n\nReasoning: ${functionArgs.reasoning}` })
        // comment on step in order to suggest a next action
        continue
      }
      if (modelAction.name == "interact_with_user") {
        this.messages.push({ role: "assistant", content: functionArgs.response })
        console.log(this.messages[this.messages.length - 1].content)
        let userInput = await this.getUserInput(rl)
        if (this.userWantsToQuit(userInput)) break 
        if (userInput) {
          this.messages.push({ role: "user", content: userInput })
        }
        continue
      }
      if (modelAction.name == "update_the_plan") {
        break
      }
      if (
        (modelAction.name == "functions:execute_shell_command") || 
        (modelAction.name == "functionsexecute_shell_command")
      ) modelAction.name = "execute_shell_command"

      if (modelAction.name != "execute_shell_command") {
        if (CliState.verbose()) console.log(`Unknown function: ${modelAction.name}`)
        continue
      }
      
      let m = `\nThe assistant wants to run \`${functionArgs.command}\`? \n\nPress enter to allow the command to run.\n\nReasoning: ${functionArgs.reasoning}`
      console.log(m)

      let userInput = await this.getUserInput(rl)
      if (this.userWantsToQuit(userInput)) break 
      if (userInput) {
        this.messages.push({ role: "assistant", content: `I attempted to run the following command, but the user interupted before the command could be run: ${functionArgs.command}\n\n` })
        this.messages.push({ role: "user", content: userInput })
        continue
      } 

      // execute the command on the user's system
      let commandOutput = ""
      let isError = false
      // use child_process to execute the command and capture the output
      if (CliState.verbose()) console.log(`Executing command: ${functionArgs.command}`)
      console.log(functionArgs.command)
      try {
          // Capture the output of the command, including stdout and stderr
          commandOutput = child_process.execSync(functionArgs.command, { stdio: 'pipe' }).toString();
      } catch (error) {
          // Capture and log both stdout and stderr from the error object
          const errorOutput = error.stdout ? error.stdout.toString() : '';
          const errorStderr = error.stderr ? error.stderr.toString() : '';
          if (CliState.verbose()) {
            console.error('Command failed:', error.message);
            console.error('Standard Output:', errorOutput);
            console.error('Standard Error:', errorStderr);
          }
          commandOutput = errorOutput + errorStderr;
      }
      console.log(commandOutput)

      this.messages.push({ role: "assistant", content: `I ran the following command: \`${functionArgs.command}\`
Reasoning: ${functionArgs.reasoning} 
${(isError ? "The command did not run successfully": "The command executed succesfully.")} 
Command output:
${commandOutput}` })

    } while (true)
    rl.close()
    return modelAction
  }

  async buildStepPlan(prompt) {
    console.log("Step planning...")
    // call the model to get the plan
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const openai = new OpenAIApi(configuration)
    let messages = [{ role: "system", content: `You are a helpful assistant. 
You have full access to the user's system and can execute shell commands.
You will be given a goal and a plan to achieve that goal as well as the current step in the plan.
Your job is to break the step down into tasks that will help us move forward on the current step of the plan. ` }]
    messages.push({ role: "user", content: `Create a list of tasks that will help us move forward on the current step of the plan. 
Talk through the tasks. Be extremely through and verbose when describing the tasks and how they relate to the current step and the larger plan to reach the user's goal.

${prompt}` })
    if (CliState.verbose()) console.log(`plan step:`)
    if (CliState.verbose()) console.log(messages)
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      temperature: 0.7,
      messages: messages,
    })
    // get the plan from the response
    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message['content']
    if (CliState.verbose()) console.log(responseBody)
    return responseBody
  }
  
  userWantsToQuit(userInput) {
    // Define keywords or phrases that indicate a desire to quit
    const quitSignals = ["quit", "exit", "stop", "end", "q", "bye", "goodbye"];

    // Normalize the user input to lower case for case-insensitive comparison
    const normalizedInput = userInput.trim().toLowerCase();

    // Check if the normalized input matches any of the quit signals
    return quitSignals.some(signal => normalizedInput === signal);
  }

  async retrieveActionFromModel() {
    if (CliState.verbose()) console.log("Retrieving the next action from the model...")
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const openai = new OpenAIApi(configuration)    
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { "type": "json_object" },
      tool_choice: "required",
      messages: this.messages,
      parallel_tool_calls: false,
      tools: [
        {
          type: "function",
          function: {
            name: "interact_with_user",
            description: "Respond to a user question or send a message to the user.",
            parameters: {
              'type': 'object',
              'properties': {
                'response': {
                  'type': 'string',
                  'description': 'The message to the user.'
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "take_note_of_something_important",
            description: "Commit some information to memory for later use.",
            parameters: {
              'type': 'object',
              'properties': {
                'informationToRemember': {
                  'type': 'string',
                  'description': 'The information to commit to memory.'
                }, 'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for remembering this information.'
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "step_verified",
            description: "Declare that the current step is complete",
            parameters: {
              'type': 'object',
              'properties': {
                'step_name': {
                  'type': 'string',
                  'description': 'The name of the step that has been verified as complete.'
                },
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for verifying the step as complete.'
                },
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "update_the_plan",
            description: "Update the plan based on the current conversation",
            parameters: {
              'type': 'object',
              'properties': {
                'planUpdates': {
                  'type': 'string',
                  'description': 'The updates that should be made to the plan.'
                },
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for updating the plan.'
                },
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "execute_shell_command",
            description: "Execute a shell command on the user's system. The output of the command will be made available to you.",
            parameters: {
              'type': 'object',
              'properties': {
                'command': {
                  'type': 'string',
                  'description': 'The shell command to execute.'
                }, 'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for executing this command in the context of the current step. Describe why the command is necessary and what you expect to achieve by running it.'
                }
              }
            }
          }
        },
      ],
    })
    if (CliState.verbose()) {
      console.log(`action response:`)
      console.log(response.data)
      console.log(response.data?.choices)
      console.log(response.data?.choices[0]?.message)
      console.log(response.data?.choices[0]?.message?.tool_calls)
    }
    return response.data?.choices[0]?.message?.tool_calls[0].function
  }

  async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }
}