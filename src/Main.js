import readline from 'readline'
import PromptrService from './services/PromptrService.js'
import CliState from './CliState.js'
import fs from 'fs'
import os from 'os'
import path from 'path'
import TemplateLoader from './services/TemplateLoader.js'
import OpenAiExtractPlanService from './services/OpenAiExtractPlanService.js'
import StepExecutor from './services/StepExecutor.js'

export default class Main {
  
  static async call(argv) {
    CliState.init(argv, await this.getVersion())

    const userPlan = await this.plan()
    if (userPlan) {
      const expandedPlan = await TemplateLoader.parseTemplate(userPlan)
      let plan = await OpenAiExtractPlanService.call(expandedPlan)
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      console.log(plan)
      console.log("Enter 'exit' to quit or 'q' to quit")
      let userInput = "" //await this.getUserInput(rl)
      rl.close()
      if (userInput == 'exit' || userInput == "q" || userInput == "\\q") return 
      for (let i = 0; i < plan.steps.length; i++) {
        console.log(`Executing step ${i + 1} of ${plan.steps.length}. Step name: ${plan.steps[i].name}\n=================`)
        let executor = new StepExecutor(plan, plan.steps[i])
        await executor.call()
      }
      return
    }

    if (argv.length <= 2) {
      console.log("Usage: promptr -m <model> <input filepath(s)> -o <output filepath> -p \"Cleanup the code in this file\"");
      return -1
    }

    // Interactive mode
    if (CliState.isInteractive()) {
      await this.loopUntilUserExit()
      return 0
    }

    // Non-interactive mode
    let prompt = CliState.getPrompt() ?? ""
    if (prompt.startsWith('http://') || prompt.startsWith('https://')) {
      const response = await fetch(prompt)
      prompt = await response.text()
    } else if (fs.existsSync(prompt)) {
      prompt = fs.readFileSync(prompt, 'utf-8')
    } else if (prompt.startsWith('~')) {
      const homeDir = os.homedir()
      const filePath = path.join(homeDir, prompt.slice(1))
      if (fs.existsSync(filePath)) {
        prompt = fs.readFileSync(filePath, 'utf-8')
      }
    }
    return await PromptrService.call(prompt)
  }

  static async plan() {
    let plan = CliState.planPath() ?? ""
    if (plan.startsWith('http://') || plan.startsWith('https://')) {
      const response = await fetch(plan)
      plan = await response.text()
    } else if (fs.existsSync(plan)) {
      plan = fs.readFileSync(plan, 'utf-8')
    } else if (plan.startsWith('~')) {
      const homeDir = os.homedir()
      const filePath = path.join(homeDir, plan.slice(1))
      if (fs.existsSync(filePath)) {
        plan = fs.readFileSync(filePath, 'utf-8')
      }
    }
    return plan
  }

  static async loopUntilUserExit() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    while (true) {
      let userInput = await this.getUserInput(rl);
      if (!userInput) continue
      if (userInput == 'exit' || userInput == "\q") break

      await PromptrService.call(userInput)
    }
    rl.close()
  }

  static async getUserInput(rl) {
    return new Promise(resolve => {
      rl.question('promptr# ', _input => {
        resolve(_input)
      })
    })
  }

  static async getVersion() {
    return "6.1.0"
  }
}
