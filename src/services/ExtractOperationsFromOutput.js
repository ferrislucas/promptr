export function extractOperationsFromOutput(input) {
  try {
    const parsedJSON = JSON.parse(input);
    return parsedJSON;
  } catch (error) {
    const jsonRegex = /({.*}|\[.*\])/s; // Regular expression to match a JSON object or array
    const match = input.match(jsonRegex);
    console.log("There was an error parsing the model's output:")
    console.log(input)
    if (match && match[1]) {
      console.log('Attemping to extract json:')
      console.log(match[1])
      try {
        const parsed = JSON.parse(match[1]);
        return parsed;
      } catch (error) {
        console.log(error)
        return null; // Return null if there's an error during JSON parsing
      }
    } else {
      return null; // Return null if no JSON object or array is found in the input string
    }
  }
}