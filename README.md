# Promptr

Promptr is a command-line interface (CLI) tool that writes the output of GPT3  model prompts to a specified file. Promptr can also accept additional arguments that specify one or more files to include in the prompt.


## Example

```
$ promptr service.js
```

promptr waits for instructions: 
```
promptr#
```

You decide you want to remove unused private methods: 
```
promptr# remove unused private methods
```

prompter leverages OpenAI GPT3 to create a new version of `service.js`

<br /><br />
## Usage

To use Promptr, run it from the command line with the following syntax:
`promptr <file1> <file2> ... <output-file>`

The `<file1>`, `<file2>`, ..., parameters are optional and specify the paths to the files that will be included as context in the prompt that's sent to OpenAI. The parameters should be separated by a space.

The `<output-file>` parameter is required and specifies the path to the file which will be created or modified with the results of your instructions.

Enter `exit` or `\q` to exit the session.

<br />

Here's another example usage of the tool:
```
promptr file1_spec.rb file2_spec.rb output.rb
```





In this example, the LLM output will be written to `output.rb`, and the prompt will include the contents of `file1_spec.rb` and `file2_spec.rb`. Including files in the prompt is useful for having the LLM create an implementation that passes one or more tests. In the example above, you could use the prompt "Make the tests pass" - the LLM will attempt to create an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`.

<br /><br />
## Installation

### With yarn
```
yarn global add @ifnotnowwhen/promptr
```

### With npm
```
npm install -g @ifnotnowwhen/promptr
```

### Set OpenAI API Key
An environment variable called `OPENAI_API_KEY` is expected to contain your OpenAI API secret key.


## License

Promptr is released under the [MIT License](https://opensource.org/licenses/MIT).


