export default class PromptContext {
  static call(args: string[]): Promise<{ files: { filename: string; content: string }[] }>
}