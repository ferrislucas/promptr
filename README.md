# Promptr

## TLDR 
Promptr is a CLI tool that makes it easy to apply GPT's code change recommendations with a single command. With Promptr, you can quickly refactor code, implement classes to pass tests, and experiment with LLMs. No more copying code from the ChatGPT window into your editor. 


## How Does This Work?
When you run `promptr`, you optionally specify a "context" to send along with your "prompt" to GPT. For example, if you want to remove all the unnecessary semicolons from a file called `index.js` then you might run something like this: 
`promptr -p "Remove all unnecessary semicolons" index.js`. 

In this example, your "prompt" is `"Remove all unnecessary semicolons"`, and the "context" is `index.js`. 
<br />
If you wanted to expand the scope of your changes then you might say: 
`promptr -p "Remove all unnecessary semicolons" index.js app.js test/app.test.js`
<br />Notice that we've added more files to the command. Promptr will send the files you specify along with your "prompt" to GPT. When a response is received (it can take a while), Promptr parses the response and applies the suggested changes to your file system.

__IMPORTANT__ 
Promptr can write and delete files as recommended by GPT, so it's critical that you commit any important work before using Promptr. 

__Don't worry.__ 
Sit back... Relaaxxxxxx... let Promptr carry you on a gentle cruise through a little place I like to call... Productivity Town.

## Table of Contents
1. [Requirements](#requirements)
2. [Introduction](#introduction)
3. [Usage](#usage)
4. [Examples](#examples)
5. [Use Cases](#use-cases)
6. [Options](#options)
7. [Installation](#installation)
8. [License](#license)

## Introduction

Promptr enables several useful workflows, such as:

- __Ask GPT to refactor your code base:__ Promptr handles passing the codebase and your prompt to GPT. Promptr then parses the response and applies the changes recommended by GPT to your codebase. See the `refactor` template below.
- __Ask GPT to update a class to pass some tests:__ given a set of unit tests and a class’s current implementation, Promptr will tell GPT to create or update an implementation of a class that makes the tests pass. Promptr handles parsing GPT’s response and updating your code. See the `test-first` example below.
- __Automate recursive prompts:__ by using Promptr to pipe model output into a file. Then use Promptr to pass the contents of that file to GPT as a prompt.
- __Experimentation:__ Promptr was born as a tool for experimenting with LLM’s. There are interactive and dry run modes as well as a templating system that exposes the files you pass to Promptr. This allows you to use those file names and file contents as you wish in your own prompts.

## Usage

`promptr  -m <mode> [options] <file1> <file2> <file3> ...`
<br />


## Examples
__Refactor a single file__
```bash
$ promptr -p "Cleanup the code in this file" index.js
```
<br />

__Refactor multiple files__
Refactoring multiple files works best with GPT4 because GPT3 has a much smaller maximum context size. 
The following example uses the gpt4 model. It refactors multiple files by passing multiple path arguments:
```bash
$ promptr -m gpt4 -p "Cleanup the code in these files" index.js app.js 
```
<br />

__Refactor all the files__
The following example uses the GPT4 model to refactor all the javascript files in the codebase. This example uses `git-tree`, `grep`, and `tr` to provide a list of paths to all .js files in the git repository:
```bash
$ promptr -m gpt4 -p "Cleanup the code in these files" $(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ')
```
<br />

## Use Cases

1. __Refactor the codebase__ 
This example sends GPT-4 all of the javascript files in the codebase and instructs the model to remove any unused methods: <br /> `promptr -m gpt4 $(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ') -p "Remove any unused methods"` <br />
- `-m gpt4` specifies the GPT4 model
- `$(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ')` gathers all the javascript files in the git repository and passes their paths to Promptr.
- `-p` provides the prompt that is passed as instructions to GPT.


2. __Test First: You supply the unit tests, GPT updates your implementation:__ 
We can use the `test-first` template to guide GPT into implemeting a class by supplying GPT with a set of unit tests that the implementation should pass:
`
promptr -m gpt4 -t test-first file1_spec.rb file2_spec.rb implementation.rb -o implementation.rb -p "use functional coding style"
`
<br />In this example, the LLM output will be written to `implementation.rb`. GPT will see the contents of `implementation.rb`, `file1_spec.rb`, and `file2_spec.rb`. The `-t` options specifies the `test-first` template which is intended to help the model produce an implementation that passes the tests in `file1_spec.rb` and `file2_spec.rb`. The model output will be an updated implementation of the class defined in `implementation.rb`, and hopefully, the new implementation will pass the given tests. What could possibly go wrong?


3. __Describe the codebase__
This example sends GPT-4 this codebase and instructs the model to describe the codebase - the `-t empty` option specifies the `empty` template which is useful for experimentation:
`promptr -m gpt4 $(git ls-tree -r --name-only HEAD | tr '\n' ' ') -t empty -p "Describe this codebase. List each class and what the class is responsible for. Also, describe the main entry point and what technologies are used."`<br />


## Options
- `-m, --mode <mode>`: Optional flag to set the mode, defaults to gpt3. Supported values are: (gpt3|gpt4)
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only the prompt that will be sent to the model is displayed. No changes are made to your filesystem when this option is used.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set then a blank prompt is used. A path or a url can also be specified - in this case the content at the specified path or url is used as the prompt. The prompt is combined with the tempate to form the payload sent to the model.
- `-t, --template <templateName | templatePath | templateUrl>`: Optional string flag that specifies a built in template name, the absolute path to a template file, or a url for a template file that will be used to generate the output. The default is the  built in `refactor` template. The available built in templates are: `empty`, `refactor`, `swe`, and `test-first`. The prompt is interpolated with the template to form the payload sent to the model.
- `-x` Optional boolean flag. Promptr attempts to parse the model's response and apply the resulting operations to the current directory tree whe using the "refactor" template. You only need to pass the `-x` flag if you've created your own template, and you want Promptr to parse the output of your template in the same way that the built in "refactor" template is parsed.
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.
- `--version`: Display the version and exit

Additional parameters can specify the paths to files that will be included as context in the prompt. The parameters should be separated by a space.

## Requirements
Node 18 is required

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
