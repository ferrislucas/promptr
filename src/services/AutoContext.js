export default class AutoContext {
  static call(prompt) {
    const filePaths = [];
    const regex = /(?:^|[\s"])(\/?[\w\.\-\/]+\.\w+)/g;
    let match;

    while ((match = regex.exec(prompt)) !== null) {
      filePaths.push(match[1]);
    }

    return filePaths;
  }
}
