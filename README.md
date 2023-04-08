# Promptr

Promptr is a CLI tool for operating on your codebase using GPT. Promptr dynamically includes one or more files into your GPT prompts, and it can optionally parse and apply the changes that GPT suggests to your codebase. Several prompt templates are included for various purposes, and users can create their own templates.

## Table of Contents
1. [Introduction](#introduction)
2. [Usage](#usage)
3. [Use Cases](#use-cases)
4. [Options](#options)
5. [Installation](#installation)
6. [License](#license)

## Introduction

Promptr enables several useful workflows, such as:

- __Ask GPT to refactor your code base:__ Promptr handles passing the codebase and your prompt to GPT. Promptr then parses the response and applies the changes recommended by GPT to your codebase. See the `refactor` template below.
- __Ask GPT to update a class to pass some tests:__ given a set of unit tests and a class’s current implementation, Promptr will tell GPT to create or update an implementation of a class that makes the tests pass. Promptr handles parsing GPT’s response and updating your code. See the `test-first` example below.
- __Automate recursive prompts:__ by using Promptr to pipe model output into a file. Then use Promptr to pass the contents of that file to GPT as a prompt.
- __Experimentation:__ Promptr was born as a tool for experimenting with LLM’s. There are interactive and dry run modes as well as a templating system that exposes the files you pass to Promptr. This allows you to use those file names and file contents as you wish in your own prompts.

## Usage

`promptr  -m <mode> [options] <file1> <file2> <file3> ...`


- Refactor a single file (using `-o` to update a single file):

```bash
$ promptr index.js -o index.js -p "Cleanup the code in this file"
```

- Refactor multiple files (using `-x` to apply changes anywhere in the current directory tree):

```bash
$ promptr -m gpt4 -x -t refactor -p "Cleanup the code in these files" index.js app.js 
```

- Refactor all the javascript files in the codebase (use `git-tree`, `grep`, and `tr` to specify the paths to all .js files):

```bash
$ promptr -m gpt4 -x -t refactor -p "Cleanup the code in these files" $(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ')
```

## Use Cases

1. __Refactor the codebase__ 
This example sends GPT-4 all of the javascript files in the codebase and instructs the model to remove any unused methods: <br /> `promptr -m gpt4 -x -t refactor $(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ') -p "Remove any unused methods"` <br />
- `-m gpt4` specifies the GPT4 model
- `-x` tells Promptr to attempt to parse the model's response and apply the resulting operations to the current directory tree - this option is only valid when using the `refactor` template.
- `-t refactor` tells Promptr to use the `refactor` template.
- `$(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ')` gathers all the javascript files in the git repository and passes their paths to Promptr.
- `-p` provides the prompt that is passed as instructions to GPT.

2. __Cleanup a file__
This example sends GPT-3 the contents of `index.js` with a prompt `"Cleanup the code in this file"`. The model's response replaces the contents of index.js: 
`promptr -m gpt3 index.js -o index.js -p "Cleanup the code in this file"`


3. __Test First: You supply the unit tests, GPT updates your implementation:__ We can use the `test-first` template to guide GPT into implemeting a class by supplying GPT with a set of unit tests that the implementation should pass:
`
promptr -m gpt4 -t test-first file1_spec.rb file2_spec.rb implementation.rb -o implementation.rb -p "use functional coding style"
`

In this example, the LLM output will be written to `implementation.rb`. The prompt will include the contents of `implementation.rb`, `file1_spec.rb`, and `file2_spec.rb`. The `-t` options specifies the `test-first` template which is intended to help the model produce an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`. The model output will be an updated implementation of the class defined in `implementation.rb`, and hopefully, the new implementation will pass the given tests.


4. __Describe the codebase__
This example sends GPT-4 this codebase (honoring `.gitignore`) and instructs the model to describe the codebase:
`promptr -m gpt4 $(git ls-tree -r --name-only HEAD | tr '\n' ' ') -p "Describe this codebase. List each class and what the class is responsible for. Also, describe the main entry point and what technologies are used."`<br />
The model's response is displayed in the console because no `-o` option is specified to direct the output to a file:
```This codebase is a command-line interface (CLI) tool called Promptr. It allows users to pass file contents through liquidjs templates and pass the resulting prompt to GPT-3 or GPT-4. The main technologies used in this codebase are Node.js, liquidjs, and the OpenAI API.

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


## Options
- `-m, --mode <mode>`: Optional flag to set the mode, defaults to gpt3. Supported values are: (gpt3|gpt4)
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only a prompt is displayed and no changes are made.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set, the default prompt is used.
- `-t, --template <templateName | templatePath | templateUrl>`: Optional string flag that specifies a built in template name, the absolute path to a  template file, or a url for a template file that will be used to generate the output. Default is the `empty` built in template. Built in templates are: `empty`, `refactor`, `swe`, and `test-first`.
- `-x` Optional string flag. When specified, Promptr attempts to parse the model's response and apply the resulting operations to the current directory tree. This option is only valid when using the `refactor` template.
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.
- `--version`: Display the version and exit

Additional parameters can specify the paths to files that will be included as context in the prompt. The parameters should be separated by a space.

## Installation

#### With yarn
```
yarn global add @ifnotnowwhen/promptr
```

#### With npm
```
npm install -g @ifnotnowwhen/promptr
```

#### Set OpenAI API Key
An environment variable called `OPENAI_API_KEY` is expected to contain your OpenAI API secret key.

#### Build Binaries using PKG
```
npm run bundle
```
```
npm run build:<platform win|macos|linux>
```
```
npm run test-binary
```

## License

Promptr is released under the [MIT License](https://opensource.org/licenses/MIT).
