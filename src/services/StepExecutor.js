import { OpenAI } from "openai"
import CliState from "../CliState.js"
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'
import SystemMessage from "./SystemMessage.js"

export default class StepExecutor {
  constructor(plan, step) {    
    this.messages = [SystemMessage.stepExecutorSystemMessage()]
    this.plan = plan
    this.step = step
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

    let modelAction = null
    // loop until the model calls the step_verified function
    do {      
      modelAction = await this.runStepIteration(rl)
      if (modelAction.name == "step_verified") break
      if (modelAction.name == "user exit") break
    } while (true)
    rl.close()
    return modelAction
  }

  async runStepIteration(rl) {
    let modelAction = await this.retrieveActionFromModel()
    let functionArgs = null
    try {
      functionArgs = JSON.parse(modelAction.arguments)  
    } catch (error) {
      console.error(error)
      return modelAction
    }

    if (CliState.verbose()) console.log(`Function: ${modelAction.name}`)
    if (CliState.verbose()) console.log(functionArgs)
    
    if (modelAction.name == "step_verified") {
      console.log(`${functionArgs.step_name} verified as complete. \n\nReasoning: ${functionArgs.reasoning}`)
    }
    if (modelAction.name == "take_note_of_something_important") {
      this.messages.push({ role: "assistant", content: `The following information has been committed to memory: ${functionArgs.informationToRemember} \n\nReasoning: ${functionArgs.reasoning}` })
      // comment on step in order to suggest a next action
      return modelAction
    }
    if (modelAction.name == "interact_with_user") {
      this.messages.push({ role: "assistant", content: functionArgs.response })
      console.log(this.messages[this.messages.length - 1].content)
      let userInput = await this.getUserInput(rl)
      if (this.userWantsToQuit(userInput)) return modelAction
      if (userInput) {
        this.messages.push({ role: "user", content: userInput })
      }
      return modelAction
    }
    if (modelAction.name == "update_the_plan") {
      return modelAction
    }
    if (
      (modelAction.name == "functions:execute_shell_command") || 
      (modelAction.name == "functionsexecute_shell_command")
    ) modelAction.name = "execute_shell_command"

    if (modelAction.name != "execute_shell_command") {
      if (CliState.verbose()) console.log(`Unknown function: ${modelAction.name}`)
      return modelAction
    }
    
    functionArgs = await this.refineShellCommmand(modelAction)
    if (functionArgs.name == "reject_shell_command") {
      this.messages.push({ role: "user", content: `The command that the assitant attempted to run was rejected. Reasoning: ${functionArgs.reasoning}` })
      return modelAction
    }

    let m = `\nThe assistant wants to run \`${functionArgs.command}\`? \n\nPress enter to allow the command to run.\n\nReasoning: ${functionArgs.reasoning}`
    console.log(m)

    let userInput = await this.getUserInput(rl)
    if (this.userWantsToQuit(userInput)) return({ name: "user exit" })
    if (userInput) {
      this.messages.push({ role: "assistant", content: `The assistant attempted to run the following command, but the user interupted before the command could be run: ${functionArgs.command}\n\n` })
      this.messages.push({ role: "user", content: userInput })
      return modelAction
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
        commandOutput = errorOutput + "\n" + errorStderr;
        isError = true
    }
    console.log(commandOutput)

    this.messages.push({ role: "assistant", content: `I ran the following command: \`${functionArgs.command}\`
Reasoning: ${functionArgs.reasoning} 
${(isError ? "The command did not run successfully": "The command executed succesfully.")} 
Command output:
${commandOutput}` })
    return modelAction
  }

  async refineShellCommmand(modelAction) {
    let functionArgs = JSON.parse(modelAction.arguments)
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
    let messages = [
      { role: "system", content: `Your goal is to consider some "ground truths" and evaluate if a shell command should be modified in adherence of the ground truths. You can use the modify_shell_command function to modify the shell command. Supply your reasoning for updating the shell command. Respond with valid JSON. Always preserve the intent of the shell command. Only modify the command if ground truths require the command to be modified. Never modify the shell command unless you have to, and always obey the reasoning for running the shell command. If a command is in direct violation of ground truths then reject the command.` },
      { role: "user", content: `The ground truths are: \n${this.plan.groundTruths?.join('\n')}\n\n \n\nThe shell command is: \`${functionArgs.command}\` \n\nReasoning for running the shell command: ${functionArgs.reasoning}\n\nModify the shell command as necessary based on ground truths` }
    ]
    if (CliState.verbose()) console.log(`refining shell command:\n${messages.map(m => m.content).join("\n")}`)
    const response = await openai.chat.completions.create({
      model: "llama3-groq-70b-8192-tool-use-preview",
      temperature: 0.7,
      tool_choice: "required",
      messages: messages,
      parallel_tool_calls: false,
      tools: [
        {
          type: "function",
          function: {
            name: "modify_shell_command",
            description: "Modify the shell command",
            parameters: {
              'type': 'object',
              'properties': {
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for modifying the shell command: describe why the original command had to be modified.'
                },
                'command': {
                  'type': 'string',
                  'description': 'The modified shell command.'
                },
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "reject_shell_command",
            description: "Reject the shell command",
            parameters: {
              'type': 'object',
              'properties': {
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for rejecting the shell command: describe why the original command needs to be rejected.'
                },
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "do_not_modify_shell_command",
            description: "Leave the shell command as is",
            parameters: {
              'type': 'object',
              'properties': {
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for modifying the shell command.'
                },
              }
            }
          }
        },
      ],
    })
    if (response?.choices[0]?.message?.tool_calls[0].function?.name == "reject_shell_command") {
      let argVals = JSON.parse(response?.choices[0]?.message.tool_calls[0].function.arguments)
      if (CliState.verbose()) {
        console.log(`Rejecting shell command:\n${functionArgs.command}\n\nReasoning: ${argVals.reasoning}`)
      }
      return argVals
    }
    if (response?.choices[0]?.message?.tool_calls[0].function?.name == "modify_shell_command") {
      let argVals = JSON.parse(response?.choices[0]?.message.tool_calls[0].function.arguments)
      if (CliState.verbose()) {
        console.log(`modifying shell command:\n${argVals.command}\n\nReasoning: ${argVals.reasoning}`)
      }
      functionArgs.command = argVals.command
    }
    return functionArgs
  }

  async buildStepPlan(prompt) {
    console.log("Step planning...")
    // call the model to get the plan
    let messages = [{ role: "system", content: `You are a helpful assistant. 
You have full access to the user's system and can execute shell commands.
You will be given a goal and a plan to achieve that goal as well as the current step in the plan.
Your job is to break the step down into tasks that will help us move forward on the current step of the plan.
List the tasks to take in order to complete the step and move towards achieving the goal.` }]
    
    messages.push({ role: "user", content: `${prompt}\n\n\nSummarize the shell commands to take in order to move forward on the current step of the plan. 
The tasks must be achievable using shell commands.` })
    if (CliState.verbose()) console.log(`plan step:`)
    if (CliState.verbose()) console.log(messages)

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })

    const response = await openai.chat.completions.create({
      model: "llama3-groq-70b-8192-tool-use-preview",
      temperature: 0.7,
      messages: messages,
      parallel_tool_calls: false,
    })
    return response.choices[0].message.content
  }
  
  userWantsToQuit(userInput) {
    // Define keywords or phrases that indicate a desire to quit
    const quitSignals = ["quit", "exit", "stop", "end", "q", "bye", "goodbye", "\\q"];

    // Normalize the user input to lower case for case-insensitive comparison
    const normalizedInput = userInput.trim().toLowerCase();

    // Check if the normalized input matches any of the quit signals
    return quitSignals.some(signal => normalizedInput === signal);
  }

  async retrieveActionFromModel() {
    if (CliState.verbose()) console.log("Retrieving the next action from the model...")
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
    
    const response = await openai.chat.completions.create({
      model: "llama3-groq-70b-8192-tool-use-preview",
      temperature: 0.7,
      //response_format: { "type": "json_object" },
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
      console.log(response?.choices[0]?.message)
      console.log(response.data?.choices)
      console.log(response.data?.choices[0]?.message)
      console.log(response.data?.choices[0]?.message?.tool_calls)
    }
    return response?.choices[0]?.message?.tool_calls[0].function
  }

  async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }
}
