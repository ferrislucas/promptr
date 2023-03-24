# Promptr

Promptr is a command-line interface (CLI) tool that writes the output of GPT3  model prompts to a specified file. Promptr can also accept additional arguments that specify one or more files to include in the prompt.

Here's an example:

At the command line, you type: `$ promptr index.js`

Promptr says: `Your wish is my command:`

You type: `alphabetize the methods in this class`

Prompter makes a call to the OpenAI API and replaces the contents of `index.js` with the result. 

Type `exit` to end the session


## Usage

To use Promptr, run it from the command line with the following syntax:
`promptr <file1> <file2> ... <output-file>`

The `<file1>`, `<file2>`, ..., parameters are optional and specify the paths to the files that will be included in the LLM prompt. They should be separated by a space.

The `<output-file>` parameter is required and specifies the path to the file where the LLM output will be written.

Here's another example usage of the tool:
`promptr file1_spec.rb file2_spec.rb output.rb`


In this example, the LLM output will be written to `output.rb`, and the prompt will include the contents of `file1_spec.rb` and `file2_spec.rb`. Including files in the prompt is useful for having the LLM create an implementation that passes one or more tests. In the example above, you could use the prompt "Make the tests pass" - the LLM will attempt to create an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`.


## Installation

To install Promptr run `npm install -g @ifnotnowwhen/promptr` or `yarn global add @ifnotnowwhen/promptr`. You'll need to set an environment variable called `OPENAI_API_KEY` with your OpenAI API secret key.


## License

Promptr is released under the [MIT License](https://opensource.org/licenses/MIT).


