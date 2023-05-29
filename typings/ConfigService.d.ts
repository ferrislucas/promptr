import { FileService } from './FileService';

export default class ConfigService {
  static retrieveConfig(): Promise<{ api: { model: string; temperature: number }; settings: { maxTokens: number } }>;
}