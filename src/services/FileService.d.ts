export class FileService {
  static write(data: string, filePath: string): Promise<void>;
  static load(filePath: string): Promise<string | null>;
  static fileExists(filePath: string): boolean;
  static log(message: string): void;
}