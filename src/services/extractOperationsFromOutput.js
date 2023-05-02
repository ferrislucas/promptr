export function extractOperationsFromOutput(input) {
  try {
    const parsedJSON = JSON.parse(input);
    return parsedJSON;
  } catch (error) {
    const jsonRegex = /({.*}|\[.*\])/s; // Regular expression to match a JSON object or array
    const match = input.match(jsonRegex);

    if (match && match[1]) {
      console.log(`match: ${match[1]}`)
      try {
        const parsedJSON = JSON.parse(match[1]);
        return parsedJSON;
      } catch (error) {
        console.log(error)
        return null; // Return null if there's an error during JSON parsing
      }
    } else {
      return null; // Return null if no JSON object or array is found in the input string
    }
  }
}