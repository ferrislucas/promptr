import { OpenAI } from "openai"
import CliState from "../CliState.js"
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'
import SystemMessage from "./SystemMessage.js"

export default class StepExecutor {
  constructor(planContent) {
    this.messages = [SystemMessage.stepExecutorSystemMessage()]
    this.planContent = planContent
  }

  async call() {
    this.messages.push({ role: "user", content: this.planContent })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

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

    if (modelAction.name == "step_verified") {
      console.log(`${functionArgs.step_name} verified as complete. \n\nReasoning: ${functionArgs.reasoning}`)
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
    if (
      (modelAction.name == "functions:execute_shell_command") || 
      (modelAction.name == "functionsexecute_shell_command")
    ) modelAction.name = "execute_shell_command"

    if (modelAction.name != "execute_shell_command") {
      if (CliState.verbose()) console.log(`Unknown function: ${modelAction.name}`)
      return modelAction
    }
    
    functionArgs = JSON.parse(modelAction.arguments)
    /*
    functionArgs = await this.rejectShellCommmand(modelAction)
    if (functionArgs.name == "reject_shell_command") {
      this.messages.push({ role: "user", content: `The command that the assistant attempted to run was rejected for these reasons: ${functionArgs.reasoning}` })
      return modelAction
    }
    functionArgs = await this.refineShellCommmand(modelAction)
    */

    let m = `\nThe assistant wants to run \`${functionArgs.command}\`? \n\nPress enter to allow the command to run.\n\nReasoning: ${functionArgs.reasoning}`
    console.log(m)

    let userInput = await this.getUserInput(rl)
    if (this.userWantsToQuit(userInput)) return({ name: "user exit" })
    if (userInput) {
      this.messages.push({
        "role": "tool",
        "content": `The following command was rejected by the user: \`${functionArgs.command}\``,
        "tool_call_id": `execute_shell_command_rejected_${new Date().getTime()}`
      })
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

    this.messages.push({
      "role": "tool",
      "content": `The following command was executed: \n\`${functionArgs.command}\`  \nThe output of the command is: \n\n\`\`\`\n${commandOutput}\n\`\`\``,
      "tool_call_id": `execute_shell_command_${new Date().getTime()}`
    })
    return modelAction
  }

  async refineShellCommmand(modelAction) {
    let functionArgs = JSON.parse(modelAction.arguments)
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
    const additionalTruths = []
    let messages = [
      { role: "system", content: `Your goal is to consider some "ground truths" and modify a shell command in adherence of the ground truths. 
You can use the modify_shell_command function to modify the shell command if necessary. 
Supply your reasoning for updating the shell command. Respond with valid JSON. 
Always preserve the intent of the shell command. 
Only modify the command if ground truths require the command to be modified. Never modify the shell command unless you have to.

${this.promptrToolDescription()}

The promptr CLI tool should only be used to create and modify source code files.
Make sure any calls to promptr adhere to the correct usage.

Make sure that all relevant ground truths are included in the instructions sent to promptr. 
For example, if the ground truths include project conventions then make sure that the instructions to promptr also include those project conventions.` },
      { role: "user", content: `The ground truths are: \n${additionalTruths.join("\n")}\n${this.plan.groundTruths?.join('\n')}\n\n\n \n\nThe shell command is: \`${functionArgs.command}\` \n\nReasoning for running the shell command: ${functionArgs.reasoning}\n\nModify the shell command as necessary based on ground truths` }
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
    if (response?.choices[0]?.message?.tool_calls[0].function?.name == "modify_shell_command") {
      let argVals = JSON.parse(response?.choices[0]?.message.tool_calls[0].function.arguments)
      if (CliState.verbose()) {
        console.log(`modifying shell command:\n${argVals.command}\n\nReasoning: ${argVals.reasoning}`)
      }
      this.messages.push({ role: "user", content: `The command that the assitant attempted to run was modified to be: ${argVals.command} \n\nReasoning: ${functionArgs.reasoning}` })
      functionArgs.command = argVals.command
    }
    return functionArgs
  }

  async rejectShellCommmand(modelAction) {
    let functionArgs = JSON.parse(modelAction.arguments)
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
    const additionalTruths = [
      "Do NOT use commands that will destroy the user's system.",
      "Do NOT use interactive shell commands like nano or vim which require user input. The promptr CLI tool is allowed because it doesn't require user interactive input.",
    ]
    let messages = [
      { role: "system", content: `Your goal is to consider some "ground truths" and evaluate if a shell command violates any of the ground truths. 
You are to reject the command if it violates any of the ground truths. 
It's okay to allow a command if the command could be modified in order to follow the ground truths - we can refine the command later.
The ground truths are: \n${additionalTruths.join("\n")}\n${this.plan.groundTruths?.join('\n')}
\n\n
Reject the command if it violates any of the ground truths. Otherwise, accept the command.` },
      { role: "user", content: `The shell command to evaluate is: \`${functionArgs.command}\` \n\nReasoning for running the shell command: ${functionArgs.reasoning}` }
    ]
    
      
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
            name: "accept_shell_command",
            description: "Accept the shell command",
            parameters: {
              'type': 'object',
              'properties': {
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning for accepting the shell command.'
                },
              }
            }
          }
        },
      ],
    })
    const toolName = response?.choices[0]?.message?.tool_calls[0].function?.name
    if (toolName == "reject_shell_command") {
      let argVals = JSON.parse(response?.choices[0]?.message.tool_calls[0].function.arguments)
      if (CliState.verbose()) {
        console.log(`Rejecting shell command:\n${functionArgs.command}\n\nReasoning: ${argVals.reasoning}`)
      }
      return { name: "reject_shell_command", reasoning: argVals.reasoning }
    }
    return functionArgs
  }

  promptrToolDescription() {
    return `The promptr CLI tool is extremely useful for authoring source code and other text based files.
      You can instruct promptr with conceptual instructions in order to create and modify source code.
      It's important to use promptr when creating, modifying, or configuring source code.
      
      Promptr usage: 
      promptr -p "instructions for creating or modifying source code" <file1> <file2> <file3> ...
      
      You can include as many files as you want in the context sent to promptr. 
      Always pass relevant file paths to promptr.
      For example, if the step you're working on calls for modifying a source code class then pass the path to the class source code to promptr - always pass the paths to any source code files that are relevant to the task when using promptr.
      
      - Promptr can create and modify source code files; it can also create or modify any text based file. For example, mermaid diagrams, svg files, etc.
      - provide a prompt with the -p argument, for example: \`promptr -p "write tests for the controller at path x/y/z and place tests at path a/b/c" x/y/z a/b/c\`
      - The promptr cli tool reports time elapsed on success. It does not display file contents.
      - Give promptr instructions as if you're giving instructions to a junior software engineer.
      - promptr requires the paths to any files that are needed to understand and accomplish the task.
      - very often, you will need to provide promptr with multiple files - for example, when creating tests provide the test path as well as any relevant production code file paths
      - the paths you pass to promptr should be relative to the current working directory
      - always give promptr conceptual instructions, not actual source code - and instruct promptr with paths to the files it should operate on. For example, instead of "write a test for the controller", say "write tests for the controller at path x/y/z and place tests at path a/b/c".
      
      Promptr examples:
      # create a class named Cat in cat.js - the class shoudl have a method named meow that returns 'meow'. Include cat_data.json in the context:
      promptr -p "create a class named Cat with a method named meow that returns 'meow' in cat.js" cat_data.json
      
      # refactor the Cat class to be named Dog add a method named bark that returns 'ruff' and include cat_data.json and dog_data.json in the context:
      promptr -p "refactor the Cat class in cat.js to be named Dog. add a method named bark that returns 'ruff'" cat_data.json dog_data.json
      
      # fix the failing test in cat_test.js and include cat.js in the context:
      promptr -p "fix the failing test in cat_test.js" cat.js cat_test.js`
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
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
    if (CliState.verbose()) {
      console.log(`Retrieving the next action from the model...`)
      console.log(this.messages.map(m => JSON.stringify(m)).join("\n"))
    }
    const response = await openai.chat.completions.create({
      model: "llama3-groq-70b-8192-tool-use-preview",
      temperature: 0.7,
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
            name: "all_done",
            description: "Signal that all work is complete",
            parameters: {
              'type': 'object',
              'properties': {
                'reasoning': {
                  'type': 'string',
                  'description': 'Your reasoning that there is nothing left to do.'
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
