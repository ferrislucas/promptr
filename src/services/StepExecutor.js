import { Configuration, OpenAIApi } from "openai"
import CliState from "../CliState.js";
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'

export default class StepExecutor {
  constructor(plan, step) {    
    this.messages = [StepExecutor.actionRetrievalSystemMessage()]
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
    // loop until the model calls the step_verified function
    do {
      loopCount++
      //if (CliState.verbose()) console.log(this.messages)
      
      let result = await this.retrieveActionFromModel()
      let functionArgs = JSON.parse(result.arguments)
      
      if (CliState.verbose()) console.log(`Function: ${result.name}`)
      if (CliState.verbose()) console.log(functionArgs)
      
      if (result.name == "step_verified") {
        console.log(`${functionArgs.step_name} verified as complete. \n\nReasoning: ${functionArgs.reasoning}`)
        break
      }
      if (result.name == "take_note_of_something_important") {
        this.messages.push({ role: "system", content: `The following information has been committed to memory: ${functionArgs.informationToRemember} \n\nReasoning: ${functionArgs.reasoning}` })
        // comment on step in order to suggest a next action
        let comment = await this.commentOnStep()
        this.messages.push({ role: "assistant", content: comment })
        continue
      }
      if (result.name == "interact_with_user") {
        this.messages.push({ role: "assistant", content: functionArgs.response })
        console.log(this.messages[this.messages.length - 1].content)
        let userInput = await this.getUserInput(rl)
        if (userInput == 'q' || userInput == "Q") break
        if (userInput) {
          this.messages.push({ role: "user", content: userInput })
        }  
        continue
      }
      
      if (
        (result.name == "functions:execute_shell_command") || 
        (result.name == "functionsexecute_shell_command")
      ) result.name = "execute_shell_command"

      if (result.name != "execute_shell_command") {
        console.log(`Unknown function: ${result.name}`)
        break
      }
      
      console.log(`\nIs it Ok to run \`${functionArgs.command}\`? \n\nReasoning: ${functionArgs.reasoning}`)
      let userInput = await this.getUserInput(rl)
      if (userInput == 'q' || userInput == "Q") break
      if (userInput) {
        this.messages.push({ role: "system", content: `You requested the following command, but the user interupted before the command you requested could be run: ${functionArgs.command}\n\nRespond to the user, or follow the user's instructions. The user's instructions take precedence over the plan.` })
        this.messages.push({ role: "user", content: userInput })
        continue
      } 
      //this.messages.push({ role: "assistant", content: `Run the following command: \`${functionArgs.command}\`\nReasoning: ${functionArgs.reasoning}` })

      // execute the command on the user's system
      let commandOutput = ""
      let isError = false
      // use child_process to execute the command and capture the output
      if (CliState.verbose()) console.log(`Executing command: ${functionArgs.command}`)
      console.log(functionArgs.command)
      try {
        commandOutput = child_process.execSync(functionArgs.command).toString()
      } catch (error) {
        isError = true
        commandOutput = error.message
      }
      console.log(commandOutput)

      this.messages.push({ role: "assistant", content: `I ran the following command: \`${functionArgs.command}\`
Reasoning: ${functionArgs.reasoning} 
${(isError ? "The command did not run successfully": "The command executed succesfully.")} 
Command output:
${commandOutput}` })

      let comment = await this.commentOnStep()
      this.messages.push({ role: "assistant", content: comment })
    } while (true)
    rl.close()
  }

  async commentOnStep() {
    console.log("Reviewing the current step and planning the next action...")
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const openai = new OpenAIApi(configuration)
    let payload  = [...this.messages, { role: "user", content: "Summarize the result of the last action taken. If the tasks for the current step need to change then list the new tasks. Then describe the next action that will help us move forward on the current step of the plan. " }]
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      temperature: 0.7,
      messages: payload
    })
    // get the plan from the response
    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message['content']
    if (CliState.verbose()) console.log(responseBody)
    return responseBody
  }

  async buildStepPlan(prompt) {
    console.log("Building a plan for the current step...")
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

  async retrieveActionFromModel() {
    console.log("Retrieving the next action from the model...")
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

  static actionRetrievalSystemMessage() {
    let currentShell = process.env.SHELL
    let currentDirectory = process.cwd()

    return {
      role: "system",
      content: `You are a helpful assistant.
You have full access to the user's system and can execute shell commands.
Your job is to help the user achieve a goal by completing a step in the user's plan to achieve the goal. 
You will be given the user's goal and a summary of the user's plan to achieve the goal. 
Your job is to complete the current step of the plan. 
If the step has a verification then perform the verification before marking the step complete.
If there is no verification for a step then ask the user to confirm before you consider a step to be complete.

You have some special capabilities that you can use to complete the step:
- executing shell commands.
- creating, modifying, and configuring source code and systems using the promptr CLI tool.
- interacting with the user to answer questions or provide information.
- taking note of important information for later use.

General rules:
Use shell for directory navigation, but only do so when necessary.
The promptr CLI tool is extremely useful for modifying source code.
You can instruct promptr with conceptual instructions in order to create and modify source code.
It's important to use promptr when creating, modifying, or configuring source code.

Promptr usage: 
promptr [options] -p "refactoring inctructions" <file1> <file2> <file3> ...

You can include as many files as you want in the context sent to promptr. Always include relevant files in the context. 
For exmaple, if the instructions mention a file, include any related code in other files by adding those files to the context as well.

- Promptr can only create and modify source code files. 
- provide a prompt with the -p argument, for example: \`promptr -p "write tests for the controller at path x/y/z and place tests at path a/b/c"\`
- The promptr cli tool reports time elapsed on success. It does not display file contents.
- Give promptr instructions as if you're giving instructions to a junior software engineer.
- promptr requires the paths to any files that would be needed to understand and accomplish the task.
- very often, you will need to provide promptr with multiple files - for example, when creating tests provide the test path as well as any relevant production code file paths
- promptr can only operate on files in the current directory, so you will need to cd into the project's root folder before each command.
- always give promptr conceptual instructions, not actual source code. For example, instead of "write a test for the controller", say "write tests for the controller at path x/y/z and place tests at path a/b/c".

Promptr examples:
# create a class named Cat in cat.js - the class shoudl have a method named meow that returns 'meow'. Include cat_data.json in the context:
promptr -p "create a class named Cat with a method named meow that returns 'meow' in cat.js" cat_data.json

# refactor the Cat class to be named Dog add a method named bark that returns 'ruff' and include cat_data.json and dog_data.json in the context:
promptr -p "refactor the Cat class in cat.js to be named Dog. add a method named bark that returns 'ruff'" cat_data.json dog_data.json

# fix the failing test in cat_test.js and include cat.js in the context:
promptr -p "fix the failing test in cat_test.js" cat.js


General information about the system:
The current shell is ${currentShell}
The current directory is ${currentDirectory}

You should execute one of these functions as your response:
- The execute_shell_command function executes a command on the user's system
- The take_note_of_something_important function stores information in your membory. Any information you store will always be available to you.
- The step_verified function is used when the step is complete. Call this function when you've verified that the step is complete.
- The interact_with_user function is used to respond to a user's question.

Only call one function at a time.
All json should be valid.
Never omit your reasoning when calling the functions when the function has a reasoning parameter.
Every command you run and its output will be logged and available to you for reference.
Don't ask for the contents of a file more than once.
Don't forget to call the step_verified function once you've verified that the current step is complete.
Always call a function for your response.`
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