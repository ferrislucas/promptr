export default class OpenAiGptService {
  static call(prompt: string, model: string, requestJsonOutput?: boolean): Promise<string | null>;
}