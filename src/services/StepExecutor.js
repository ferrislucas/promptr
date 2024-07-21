import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'

export default class StepExecutor {
  constructor(plan, step) {    
    this.messages = [StepExecutor.systemMessage()]
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

    // loop until the model calls the step_verified function
    do {
      console.log(this.messages)
      let result = await this.callModel()
      console.log(`model response:`)
      console.log(result)
      let functionArgs = JSON.parse(result.arguments)
      if (result.name == "step_verified") {
        console.log(`Step ${functionArgs.step_name} verified as complete. \n\nReasoining: ${functionArgs.reasoning}`)
        break
      }
      this.messages.push({ role: "system", content: `Is it ok to run the following command: \`${functionArgs.command}\`? Reasoning: ${functionArgs.reasoning}` })
      console.log(`Ok to run \`${functionArgs.command}\`? \n\nReasoning: ${functionArgs.reasoning}`)
      let userInput = await this.getUserInput(rl)
      if (userInput == 'n' || userInput == "N") break
      if (userInput) {
        this.messages.push({ role: "system", content: "The command was not run because the user interupted with a message." })
        this.messages.push({ role: "user", content: userInput })
        continue
      } 
      this.messages.push({ role: "assistant", content: `Run the following command: \`${functionArgs.command}\`\nReasoning: ${functionArgs.reasoning}` })

      // execute the command on the user's system
      let commandOutput = ""
      let error = false
      // use child_process to execute the command and capture the output
      try {
        commandOutput = child_process.execSync(functionArgs.command).toString()
      } catch (error) {
        error = true
        commandOutput = error.message
      }

      this.messages.push({ role: "system", content: `${error ? "The command did not run successfully": "The command executed succesfully."} Command output: ${commandOutput}` })
    } while (true)
    rl.close()
  }

  async callModel() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const openai = new OpenAIApi(configuration)    
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      temperature: 0.7,
      response_format: { "type": "json_object" },
      messages: this.messages,
      functions: [
        {
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
        },
        {
          name: "step_verified",
          description: "Call this method when the step is verified complete",
          parameters: {
            'type': 'object',
            'properties': {
              'step_name': {
                'type': 'string',
                'description': 'The name of the step that has been verified as complete.'
              },
            }
          }
        }
      ],
      function_call: { "name": "execute_shell_command" }
    })

    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message.function_call
    if (CliState.verbose()) console.log(responseBody)
    return responseBody
  }

  static systemMessage() {
    let currentShell = process.env.SHELL
    let currentDirectory = process.cwd()

    return {
      role: "system",
      content: `You are a helpful assistant. You will perform any action for the user in order to help them achieve their goal. 
You will be given a goal and the summary of a plan to achieve that goal. 
Your job is to complete a step in the plan in order to achieve the goal. 
The step will have a verification that you must complete in order to confirm that the step is complete.

You have two capabilities that you can use to complete the step:
- executing shell commands
- creating, modifying, and configuring source code and systems using the promptr CLI tool.

Use shell for directory navigation.
Use shell or promptr for all tasks - assume all calls to promptr are successful.
The promptr CLI tool is extremely useful for modifying source code.
You can instruct promptr with conceptual instructions in order to create and modify source code.
It's important to use promptr when creating, modifying, or configuring source code.
Promptr can only create and modify source code files. 
Instructions for using promptr in to create, modify, and configure source code:
- provide a prompt with the -p argument, for example: \`promptr -p "write tests for the controller at path x/y/z and place tests at path a/b/c"\`
- The promptr cli tool reports time elapsed on success. It does not display file contents.
- Give promptr instructions as if you're giving instructions to a junior software engineer.
- promptr requires the paths to any files that would be needed to understand and accomplish the task.
- very often, you will need to provide promptr with multiple files - for example, when creating tests provide the test path as well as any relevant production code file paths
- promptr can only operate on files in the current directory, so you will need to cd into the project's root folder before each command.
- always give promptr conceptual instructions, not actual source code. For example, instead of "write a test for the controller", say "write tests for the controller at path x/y/z and place tests at path a/b/c".
      
The current shell is ${currentShell}
The current directory is ${currentDirectory}

Always respond with json. 
Call the execute_shell_command function to execute command, or call the step_verified function when the step is complete.
Never omit your reasoning when calling the functions.
Every command you run and its output will be logged and available to you for reference.`
    }
  }

  async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }
}