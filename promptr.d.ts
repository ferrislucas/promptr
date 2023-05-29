declare module '@ifnotnowwhen/promptr' {
  export class OpenAiGptService {
    static call(prompt: string, model: string, requestJsonOutput?: boolean): Promise<string | null>;
  }

  export class PromptContext {
    static call(args: string[]): Promise<{ files: { filename: string; content: string }[] }>
  }

  export class PromptrService {
    static call(userInput: string): Promise<number>;
    static processPipedInput(): Promise<void>;
    static executeMode(model: string, prompt?: string): Promise<string>;
    static shouldRefactor(templatePath: string): boolean;
  }

  export class RefactorResultProcessor {
    static call(data: { operations: { filePath: string; fileContents: string; crudOperation: string; destinationPath?: string }[] }): void;
  }

  export class SystemMessage {
    static systemMessages(): { role: string; content: string }[];
  }

  export class TemplateLoader {
    static loadTemplate(prompt: string, context: object, template: string): Promise<string>;
    static loadTemplateFromUrl(templateUrl: string): Promise<string>;
    static loadTemplateFromPath(templatePath: string): Promise<string>;
  }

  export class TemplateUrl {
    static refactor: string;
    static empty: string;
    static swe: string;
    static testFirst: string;
  }
}
