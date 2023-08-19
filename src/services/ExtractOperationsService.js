export class ExtractOperationsService {
  static call(input) {
    try {
      const parsedJSON = JSON.parse(input);
      return parsedJSON;
    } catch (error) {
      return this.tryAgain(input)
    }
  }

  static tryAgain(input) {
    try {
      // Replace triple double quotes with single double quotes
      const correctedString = input.replace(/"{3}|'{3}/g, "\"")
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
