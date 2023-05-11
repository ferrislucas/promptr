# Promptr

## TLDR 
Promptr is a CLI tool that makes it easy to apply GPT's code change recommendations with a single command. With Promptr, you can quickly refactor code, implement classes to pass tests, and experiment with LLMs. No more copying code from the ChatGPT window into your editor. 

<br />

[This PR](https://github.com/ferrislucas/promptr/pull/38) has some good examples of what can be accomplished using Promptr. You can find links to the individual commits and the prompts that created them in the PR description.

<br /><br />

## Introduction
Promptr automates the process of providing ChatGPT with source code and a prompt, and then applying ChatGPT's response to the filesystem. This allows you to apply plain English instructions to your codebase. This is most effective with GPT4 because of its larger context window, but GPT3 is still useful for smaller scopes. 
<br />

I've found this to be good workflow:
- Commit any changes, so you have a clean working area
- Author your prompt in a text file. Work with the prompt in your favorite editor - mold it into clear instructions almost as if it's a task for an inexperienced co-worker. 
- Use promptr to send your prompt __and the relevant files__ to GPT. It's critical to send the relevant files with your request. Think about what files your inexperienced co-worker would need to know about in order to fulfill the request.
- Complex requests can take a while (or timeout). When the response is ready, promptr applies the changes to your filesystem. Use your favorite git UI to inspect the results. 

<br /><br />


## Examples
__Cleanup the code in a file__
```bash
$ promptr -p "Cleanup the code in this file" index.js
```
<br />

__Cleanup the code in two files__
<br />
The following example uses GPT4 to cleanup the code in two files by passing the file paths as arguments:
```bash
$ promptr -m gpt4 -p "Cleanup the code in these files" app/index.js app.js 
```
<br />

__Alphabetize the methods in all of the javascript files__ 
<br />
This example uses `git-tree`, `grep`, and `tr` to pass a list of javascript file paths to promptr:
```bash
$ promptr -m gpt4 -p "Alphabetize the method names in all of these files" $(git ls-tree -r --name-only HEAD | grep ".js" | tr '\n' ' ')
```
<br />

__Given some tests, ask the model for an implementation that makes the tests pass__ 
<br />
The following example asks GPT4 to modify app/models/model.rb so that the tests in spec/models/model_spec.rb will pass:
```bash
$ promptr -m gpt4 -t test-first spec/models/model_spec.rb app/models/model.rb -o app/models/model.rb
```
<br />
<br />

## How Does This Work?
When you run promptr, you specify a "context" to send along with your "prompt" to GPT. The "context" is one or more files that GPT needs to know about. The "prompt" is your instruction to GPT. <br /> For example, if you want to remove all the unnecessary semicolons from a file called index.js then you might run something like this: 
<br />
`promptr -p "Remove all unnecessary semicolons" index.js` 
<br /><br />
In the example above, your "prompt" is `"Remove all unnecessary semicolons"`, and the "context" is `index.js`.
<br /><br /><br />
If you wanted to expand the scope of your changes then you might say: <br />
`promptr -p "Remove all unnecessary semicolons" index.js app.js test/app.test.js`
<br />
<br />Notice that we've added more files to the command. Promptr will send the files you specify along with your "prompt" to GPT. When a response is received (it can take a while), Promptr parses the response and applies the suggested changes to your file system.
<br /><br /><br />
__IMPORTANT__ 
Promptr can write and delete files as recommended by GPT, so it's critical that you commit any important work before using Promptr. 

__Don't worry.__ 
Sit back... Relaaxxxxxx... let Promptr carry you on a gentle cruise through a little place I like to call... Productivity Town.
<br /><br />

<br />

## Usage

`promptr  -m <model> [options] <file1> <file2> <file3> ...`

<br />
<br />

## Options
- `-m, --model <model>`: Optional flag to set the model, defaults to gpt3. Supported values are: (gpt3|gpt4)
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only the prompt that will be sent to the model is displayed. No changes are made to your filesystem when this option is used.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set then a blank prompt is used. A path or a url can also be specified - in this case the content at the specified path or url is used as the prompt. The prompt is combined with the tempate to form the payload sent to the model.
- `-t, --template <templateName | templatePath | templateUrl>`: Optional string flag that specifies a built in template name, the absolute path to a template file, or a url for a template file that will be used to generate the output. The default is the  built in `refactor` template. The available built in templates are: `empty`, `refactor`, `swe`, and `test-first`. The prompt is interpolated with the template to form the payload sent to the model.
- `-x` Optional boolean flag. Promptr attempts to parse the model's response and apply the resulting operations to the current directory tree whe using the "refactor" template. You only need to pass the `-x` flag if you've created your own template, and you want Promptr to parse the output of your template in the same way that the built in "refactor" template is parsed.
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.
- `--version`: Display the version and exit

Additional parameters can specify the paths to files that will be included as context in the prompt. The parameters should be separated by a space.

<br />
<br />

## Requirements
- Node 18
- [API key from OpenAI](https://beta.openai.com/account/api-keys)
- [Billing setup in OpenAI](https://platform.openai.com/account/billing/overview)

<br />

## Installation

#### With yarn
```
yarn global add @ifnotnowwhen/promptr
```

#### With npm
```
npm install -g @ifnotnowwhen/promptr
```

#### With the release binaries
You can install Promptr by copying the binary for the current release to your path. Only MacOS is supported right now.

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
