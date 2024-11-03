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
      if (!filePaths.includes(match[1]) && !this.isInsideLiquidComment(prompt, match.index)) {
        filePaths.push(match[1]);
      }
    }

    return filePaths;
  }

  /**
   * Checks if a file path is inside a liquid comment tag.
   *
   * @param {string} prompt - The input prompt containing file paths.
   * @param {number} index - The index of the file path in the prompt.
   * @returns {boolean} True if the file path is inside a liquid comment tag, false otherwise.
   */
  static isInsideLiquidComment(prompt, index) {
    const before = prompt.slice(0, index);
    const after = prompt.slice(index);
    const openTag = before.lastIndexOf('{% comment %}');
    const closeTag = before.lastIndexOf('{% endcomment %}');
    return openTag > closeTag && after.includes('{% endcomment %}');
  }
}
