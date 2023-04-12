import fs from 'fs';
import path from 'path';

export default class RefactorResultProcessor {
  static call(data) {
    data.operations.forEach((operation) => {
      const filePath = operation.filePath;
      const fileContents = operation.fileContents;
      const absolutePath = path.resolve(filePath);
      const dirPath = path.dirname(absolutePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(absolutePath, fileContents, 'utf-8');
    });
  }
}
