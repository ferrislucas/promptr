export class ExtractOperationsService {

  static call(input) {
    try {
      const parsedJSON = JSON.parse(input);
      return parsedJSON;
    } catch (error) {
      return this.fixInvalidJson(input)
    }
  }

  static fixInvalidJson(input) {
    try {
      let result = "";
      let isInString = false;

      // First, replace all occurrences of """ with ".
      let fixedQuotes = input.replace(/"""/g, '"');

      for (let i = 0; i < fixedQuotes.length; i++) {
          const currentChar = fixedQuotes[i];

          // Toggle string state
          if (currentChar === '"' && (i === 0 || fixedQuotes[i-1] !== '\\')) {
              isInString = !isInString;
          }

          if (isInString && currentChar === '\n' && fixedQuotes[i-1] !== ' ') { // check if the previous character is not a space to determine the start of the string
              result += "\\n";
          } else {
              result += currentChar;
          }
      }
      return JSON.parse(result)      
    } catch (error) {
      return this.tryAgain(input)
    }
  }

  static tryAgain(input) {
    try {
      // Replace triple double quotes with single double quotes
      const correctedString = input.replace(/(\r?\n)"""/g, '"').replace(/"{3}(?:\r?\n)?/g, '"')
      return JSON.parse(correctedString)
    } catch (error) {
      const jsonRegex = /({.*}|\[.*\])/s; // Regular expression to match a JSON object or array
      const match = input.match(jsonRegex);
      if (match && match[1]) {
        console.log('Attemping to extract json:')
        console.log(match[1])
        try {
          const parsed = JSON.parse(match[1]);
          return parsed;
        } catch (error) {
          console.log(error)
          return null
        }
      } else {
        console.log("There was an error parsing the model's output:")
        console.log(input)
        return null
      }
    }
  }

}
