# Promptr

Promptr is a command-line interface (CLI) tool that writes the output of GPT3  model prompts to a specified file. Promptr can also accept additional arguments that specify one or more files to include in the prompt.

<br /><br />
## Usage

To use Promptr, run it from the command line. This example sends GPT-3 the contents of `index.js` with a prompt `"Cleanup the code in this file"`. The model's response replaces the contents of `index.js`:
`promptr -m gpt3 index.js -o index.js -p "Cleanup the code in this file"`

## Options
- `-m, --mode <mode>`: Required flag to set the mode. Supported values are: (gpt3|gpt4)
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only a prompt is displayed and no changes are made.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set, the default prompt is used.
- `-t, --template-path <templatePath>`: Optional string flag that specifies the absolute path to the template file that will be used to generate the output. Default is an empty template.
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.


Additional parameters can specify the paths to files that will be included as context in the prompt. The parameters should be separated by a space.

<br />

Here's another example using multiple input files and the "tests" template:
```
promptr -m gpt4 -t tests file1_spec.rb file2_spec.rb implementation.rb -o implementation.rb -p "use functional coding style"
```


In this example, the LLM output will be written to `implementation.rb`, and the prompt will include the contents of `file1_spec.rb` and `file2_spec.rb`. Including files in the prompt is useful for having the LLM create an implementation that passes some tests that you supply. In the example above, the model output will be an implementation intended to pass the given tests. The `-t` options specifies the "tests" template which is intended to help the model produce an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`.

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


