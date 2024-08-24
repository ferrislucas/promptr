import { Configuration, OpenAIApi } from "openai"
import TemplateLoader from './TemplateLoader.js';
import OpenAiExtractPlanService from './OpenAiExtractPlanService.js';
import StepExecutor from './StepExecutor.js';
import CliState from '../CliState.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default class Agent {
  static async call(userPlan) {
    const expandedPlan = await TemplateLoader.parseTemplate(userPlan);
    let plan = await OpenAiExtractPlanService.call(expandedPlan);
    console.log(`Goal: ${plan.goal}\n\nSummary: ${plan.summary}\n\n`)
    for (let i = 0; i< plan.steps.length; i++) {
      console.log(`Step ${i + 1}: ${plan.steps[i].name}\n${plan.steps[i].description}\n\n`)
    }
    for (let i = 0; i < plan.steps.length; i++) {
      console.log(`\n\nExecuting step ${i + 1} of ${plan.steps.length}: \n${plan.steps[i].name}\n${plan.steps[i].description}\n\n`);
      let currentStep = plan.steps[i];
      let executor = new StepExecutor(plan, currentStep);
      let modelAction = await executor.call()
      if (modelAction?.name === 'user exit') break
      if (modelAction?.name === 'update_the_plan') {        
        let newPlan = await Agent.calculateUpdatedPlan(expandedPlan, plan, currentStep, modelAction, executor.messages)
        console.log(`The updated plan is\n${newPlan}`)
        await Agent.call(newPlan)
        break 
      }
    }
  }

  static async calculateUpdatedPlan(userPlan, plan, currentStep, modelAction, stepExecutorMessages) {
    console.log("Updating the plan...")
    let functionArgs = JSON.parse(modelAction.arguments)
    // build transcript that excludes system messages
    let transcript = stepExecutorMessages
      .filter(message => message.role != 'system')
      .map(message => `${message.role}: ${message.content}`)
      .join("\n");
      const prompt = `The goal is: ${plan.goal}
      The plan summary is: ${plan.summary}
      
      You are currently working on this step in the plan:
      Step: ${currentStep.name}
      
      Description: ${currentStep.description}`
      
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      basePath: process.env.OPENAI_API_BASE || "https://api.openai.com/v1"
    })
    const openai = new OpenAIApi(configuration)
    let payload  = [
      { role: "system", content: "You want to assist the user to achieve their goal. You will be given the current plan to achieve the user's goal. You will also be given a transcript of a conversation between the user and their assistant. Your job is to create an updated version of the plan given any new information that the conversation transcript yields. Only respond with the plan, don't preface with comments, salutations, etc: just state the updated plan without other explanation. Be extremely detailed when describing the plan." },
      { role: "user", content: `${prompt}\n\nThe user is currently on this step of the plan: ${currentStep.name}\n\nThe user assistant's reasoning for updating the plan is:\n${functionArgs.reasoning}\n\nThe user assistant's suggested updates are:\n${functionArgs.planUpdates}\n\nThe original user's request was:\n${userPlan}\n\nHere is the transcript:${transcript}` },
    ]
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      temperature: 0.7,
      messages: payload
    })
    if (!response?.data?.choices) return null
    const responseBody = response.data.choices[0].message['content']
    if (CliState.verbose()) console.log(responseBody)
    return responseBody
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
