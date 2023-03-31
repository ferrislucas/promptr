# Promptr

Promptr is a command-line interface (CLI) tool that allows you to pass file contents through liquidjs templates and pass the resulting prompt to GPT3 or GPT4.

<br /><br />
## Example Uses


### Cleanup some code
This example sends GPT-3 the contents of `index.js` with a prompt `"Cleanup the code in this file"`. The model's response replaces the contents of index.js: 
<br />
`promptr -m gpt3 index.js -o index.js -p "Cleanup the code in this file"`

<br /><br />
### Describe the codebase
This example sends GPT-4 the codebase (honoring .gitignore) instructing the model to describe the codebase. The model's response is displayed in the console: 
```
promptr -m gpt4 -p "Describe this codebase. List each class and what the class is responsible for. Also, describe the main entry point and what technologies are used." $(git ls-tree -r --name-only HEAD | tr '\n' ' ')

This codebase is a command-line interface (CLI) tool called Promptr. It allows users to pass file contents through liquidjs templates and pass the resulting prompt to GPT-3 or GPT-4. The main technologies used in this codebase are Node.js, liquidjs, and the OpenAI API.

The main entry point is "bin/index.js", which imports and calls the MainService from "main.js".

There are several classes in this codebase:

1. CliState (cliState.js): This class handles the initialization and management of command-line arguments and options.

2. ConfigService (configService.js): This class is responsible for retrieving and managing the configuration settings for the application.

3. FileService (fileService.js): This class provides file-related utility functions, such as reading and writing files.

4. Gpt3Service (gpt3Service.js): This class is responsible for interacting with the GPT-3 API and processing the response.

5. Gpt4Service (gpt4Service.js): This class is responsible for interacting with the GPT-4 API and processing the response.

6. Main (main.js): This class is the main entry point of the application, responsible for handling user input and managing the application flow.

7. PluginService (pluginService.js): This class is responsible for processing the user input and managing the interaction with the GPT-3 or GPT-4 services based on the user's selected mode.

In addition to the main classes, there are several templates used for generating prompts, located in the "templates" folder.

```

<br /><br />

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


