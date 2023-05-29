export default class PromptrService {
  static call(userInput: string): Promise<number>;
  static processPipedInput(): Promise<void>;
  static executeMode(model: string, prompt?: string): Promise<string>;
  static shouldRefactor(templatePath: string): boolean;
}