import { OpenAI } from "openai"
import CliState from "../CliState.js"
import process from 'process'
import readline from 'readline'
import child_process from 'child_process'
import SystemMessage from "./SystemMessage.js"
import fs from 'fs'

export default class ChatService {
  constructor(pathToPlan = null) {
    this.groundTruths = []
    this.pathToPlan = pathToPlan
    // set path to plan to temp file if none is defined
    if (!this.pathToPlan) {
      // use a temp filename for the plan
      this.pathToPlan = `/tmp/promptr-plan-${new Date().getTime()}.md`
      console.log(`Using temp file for plan: ${this.pathToPlan}`)
    }
    // create the plan file if it doesn't exist
    if (!fs.existsSync(this.pathToPlan)) {
      fs.writeFileSync(this.pathToPlan, ``)
    }
    let planContent = fs.readFileSync(this.pathToPlan, 'utf-8')
    this.messages = [SystemMessage.chatServiceSystemMessage(this.pathToPlan, planContent)]
  }

  async call() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const firstAssistantMessage = `Hi! Let's work together to make a plan.`
    console.log(firstAssistantMessage)
    this.messages.push({ role: "assistant", content: firstAssistantMessage })
    let userInput = await this.getUserInput(rl)
    if (this.userWantsToQuit(userInput)) return({ name: "user exit" })
    if (userInput) {
      this.messages.push({ role: "user", content: userInput })
    } 

    let modelAction = null
    // loop until the model calls the step_verified function
    do {      
      modelAction = await this.runStepIteration(rl)
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
    
    if (modelAction.name == "save_plan") {
      const content = JSON.parse(modelAction.arguments).planContent
      console.log(`saving the plan:\n${content}`)
      
      // save the plan to this.pathToPlan
      fs.writeFileSync(this.pathToPlan, content)
      this.messages.push({
        "role": "tool",
        "content": `The plan was saved.`,
        "tool_call_id": `save_plan_${new Date().getTime()}`
      })
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
/*
    this.messages.push({ role: "assistant", content: `I ran the following command: \`${functionArgs.command}\`
Reasoning: ${functionArgs.reasoning} 
${(isError ? "The command did not run successfully": "The command executed succesfully.")} 
Command output:
${commandOutput}` })
*/
    this.messages.push({
      "role": "tool",
      "content": `The following command was executed: \n\`${functionArgs.command}\`  \nThe output of the command is: \n\n\`\`\`\n${commandOutput}\n\`\`\``,
      "tool_call_id": `execute_shell_command_${new Date().getTime()}`
    })
    return modelAction
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
    if (CliState.verbose()) {
      console.log(`Retrieving the next action from the model...`)
      console.log(this.messages.map(m => JSON.stringify(m)).join("\n"))
    }
    let retries = 2;
    while (retries >= 0) {
      try {
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
            {
              type: "function",
              function: {
                name: "save_plan",
                description: "Save the plan.",
                parameters: {
                  'type': 'object',
                  'properties': {
                    'planContent': {
                      'type': 'string',
                      'description': 'The plan in markdown format'
                    }
                  }
                }
              }
            },
          ],
        })
        return response?.choices[0]?.message?.tool_calls[0].function;
      } catch (error) {
        if (retries === 0) {
          throw error;
        }
        retries--;
        if (CliState.verbose()) console.log(`Retrying... Attempts left: ${retries}`);
      }
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
