# Promptr

Promptr is a command-line interface (CLI) tool that writes the output of GPT3  model prompts to a specified file. Promptr can also accept additional arguments that specify one or more files to include in the prompt.

<br /><br />
## Usage

To use Promptr, run it from the command line with the following syntax:
`promptr -i <file1>`

## Options
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only a prompt is displayed and no changes are made.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set, the default prompt is used.
- `-t, --template-path <templatePath>`: Optional string flag that specifies the path to the template file that will be used to generate the output.
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.


The `<file1>`, `<file2>`, ..., parameters specify the paths to the files that will be included as context in the prompt. The parameters should be separated by a space.


In interactive mode, you can enter `exit` or `\q` to quit the session.

<br />

Here's another example usage of the tool:
```
promptr file1_spec.rb file2_spec.rb output.rb -o output.rb
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


