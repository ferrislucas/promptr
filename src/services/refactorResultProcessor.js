import fs from 'fs';
import path from 'path';

export default class RefactorResultProcessor {
  static call(data) {
    data.operations.forEach((operation) => {
      const filePath = operation.filePath
      const fileContents = operation.fileContents
      const absolutePath = path.resolve(filePath)
      const dirPath = path.dirname(absolutePath)

      if (operation.crudOperation === 'create' || operation.crudOperation === 'update') {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        fs.writeFileSync(absolutePath, fileContents, 'utf-8')
      } else if (operation.crudOperation === 'delete') {
        if (fs.existsSync(absolutePath)) {
          if (fs.lstatSync(absolutePath).isDirectory()) {
            fs.rmdirSync(absolutePath, { recursive: true });
          } else {
            fs.unlinkSync(absolutePath);
          }
        }
      } else if (operation.crudOperation === 'move') {
        const destinationPath = operation.destinationPath;
        const absoluteDestinationPath = path.resolve(destinationPath);
        const destinationDirPath = path.dirname(absoluteDestinationPath);

        if (!fs.existsSync(destinationDirPath)) {
          fs.mkdirSync(destinationDirPath, { recursive: true });
        }
        fs.renameSync(absolutePath, absoluteDestinationPath);
      }
    })
  }
}