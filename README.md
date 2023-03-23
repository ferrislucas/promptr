# Promptr

Promptr is a command-line interface (CLI) tool built on Node.js that writes the output of LLM prompts to a file specified by a command line argument. The tool can also accept additional arguments that specify one or more files to include in the prompt.

## Installation

To install Promptr run `npm install -g promptr`


## Usage

To use Promptr, run it from the command line with the following syntax:
`promptr <file1> <file2> ... <output-file>`

The `<file1>`, `<file2>`, ..., parameters are optional and specify the paths to the files that will be included in the LLM prompt. They should be separated by a space.

The `<output-file>` parameter is required and specifies the path to the file where the LLM output will be written.

Here's an example usage of the tool:
`promptr file1_spec.rb file2_spec.rb output.rb`


In this example, the LLM output will be written to `output.rb`, and the prompt will include the contents of `file1_spec.rb` and `file2_spec.rb`. Including files in the prompt is useful for having the LLM create an implementation that passes one or more tests. In the example above, you could use the prompt "Make the tests pass" - the LLM will attempt to create an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`.


## License

Promptr is released under the [MIT License](https://opensource.org/licenses/MIT).


