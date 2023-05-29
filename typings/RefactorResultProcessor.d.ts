import fs from 'fs';
import path from 'path';

export default class RefactorResultProcessor {
  static call(data: { operations: { filePath: string; fileContents: string; crudOperation: string; destinationPath?: string }[] }): void;
}