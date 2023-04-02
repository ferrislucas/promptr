import fs from 'fs';
import path from 'path';

export default class RefactorResultProcessor {
  static call(jsonFilePath) {
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(jsonData);

    data.operations.forEach((operation) => {
      const filePath = operation.filePath;
      const fileContents = operation.fileContents;
      const absolutePath = path.resolve(filePath);
      fs.writeFileSync(absolutePath, fileContents, 'utf-8');
    });
  }
}
