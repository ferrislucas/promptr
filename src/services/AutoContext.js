export default class AutoContext {
  /**
   * Extracts file paths from the given prompt.
   *
   * @param {string} prompt - The input prompt containing file paths.
   * @returns {string[]} An array of extracted file paths.
   */
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
