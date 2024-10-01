import { OpenAI } from "openai"
import ChatService from './ChatService.js';
import CliState from '../CliState.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default class Agent {
  static async call(userPlan) {
    let executor = new ChatService(CliState.planPath())
    await executor.call()
    return
  }

  static async userPlan() {
    let plan = CliState.planPath() ?? "";
    if (plan.startsWith('http://') || plan.startsWith('https://')) {
      const response = await fetch(plan);
      plan = await response.text();
    } else if (fs.existsSync(plan)) {
      plan = fs.readFileSync(plan, 'utf-8');
    } else if (plan.startsWith('~')) {
      const homeDir = os.homedir();
      const filePath = path.join(homeDir, plan.slice(1));
      if (fs.existsSync(filePath)) {
        plan = fs.readFileSync(filePath, 'utf-8');
      }
    }
    return plan;
  }
}
