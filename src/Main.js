import readline from 'readline';
import PromptrService from './services/PromptrService.js';
import CliState from './CliState.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Agent from './services/Agent.js';

export default class Main {
  static async call(argv) {
    CliState.init(argv, await this.getVersion());

    if (CliState.planPath() || CliState.isInteractive() || (CliState.getPrompt() ?? "") === "") {
      let userPlan = await Agent.userPlan()
      if (!userPlan) {
        userPlan = "Your goal is to work with the user to form a plan.\n\n Step 1\n- Ask the user for their goal, work with them to form a plan. Be terse. Just get the information you need to form a plan.\n- Ask the user to confirm when the plan is complete.\n- Update the plan by calling the update_the_plan function."
      }
      await Agent.call(userPlan)
      return 0
    }

    if (argv.length <= 2) {
      console.log("Usage: promptr -m <model> <input filepath(s)> -o <output filepath> -p \"Cleanup the code in this file\"");
      return -1;
    }

    // Non-interactive mode
    let prompt = CliState.getPrompt() ?? "";
    if (prompt.startsWith('http://') || prompt.startsWith('https://')) {
      const response = await fetch(prompt);
      prompt = await response.text();
    } else if (fs.existsSync(prompt)) {
      prompt = fs.readFileSync(prompt, 'utf-8');
    } else if (prompt.startsWith('~')) {
      const homeDir = os.homedir();
      const filePath = path.join(homeDir, prompt.slice(1));
      if (fs.existsSync(filePath)) {
        prompt = fs.readFileSync(filePath, 'utf-8');
      }
    }
    return await PromptrService.call(prompt);
  }

  static async getVersion() {
    return "6.1.0";
  }
}
