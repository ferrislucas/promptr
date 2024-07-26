import TemplateLoader from './TemplateLoader.js';
import OpenAiExtractPlanService from './OpenAiExtractPlanService.js';
import StepExecutor from './StepExecutor.js';
import CliState from '../CliState.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default class Agent {
  static async call(userPlan) {
    if (userPlan) {
      const expandedPlan = await TemplateLoader.parseTemplate(userPlan);
      let plan = await OpenAiExtractPlanService.call(expandedPlan);
      console.log(`Goal: ${plan.goal}\n\nSummary: ${plan.summary}\n\n`)
      for (let i = 0; i< plan.steps.length; i++) {
        console.log(`Step ${i + 1}: ${plan.steps[i].name}\n${plan.steps[i].description}\n\n`)
      }
      for (let i = 0; i < plan.steps.length; i++) {
        console.log(`\n\nExecuting step ${i + 1} of ${plan.steps.length}: 
${plan.steps[i].name}
${plan.steps[i].description}\n\n`);
        let executor = new StepExecutor(plan, plan.steps[i]);
        await executor.call();
      }
      return;
    }
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
