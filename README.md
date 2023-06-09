# Promptr

Promptr is a CLI tool that lets you use plain English to instruct GPT3 or GPT4 to make changes to your codebase. This is most effective with GPT4 because of its larger context window, but GPT3 is still useful for smaller scopes. 
<br /><br />

The PR's below are good examples of what can be accomplished using Promptr. You can find links to the individual commits and the prompts that created them in the PR descriptions.
- https://github.com/ferrislucas/promptr/pull/38
- https://github.com/ferrislucas/promptr/pull/41
<br /><br />

I've found this to be a good workflow:
- Commit any changes, so you have a clean working area.
- Author your prompt in a text file. The prompt should be specific clear instructions. 
- Make sure your prompt contains the relative paths of any files that are relevant to your instructions. 
- Use Promptr to execute your prompt. Provide the path to your prompt file using the `-p` option: 
`promptr -p my_prompt.txt` 
*If you have access to GPT4 then use the `-m gpt4` option to get the best results.*

Complex requests can take a while. If a task is too complex then the request will timeout - try breaking the task down into smaller units of work when this happens. When the response is ready, promptr applies the changes to your filesystem. Use your favorite git UI to inspect the results. 

<br /><br />


## Examples
__Cleanup the code in a file__
Promptr recognizes that the file `src/index.js` is referenced in the prompt, so the contents of `src/index.js` is automatically sent to the model along with the prompt.
```bash
$ promptr -p "Cleanup the code in src/index.js"
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
<br /><br />

## Usage

`promptr  -m <model> [options] <file1> <file2> <file3> ...`

<br />
<br />

## Options
- `-m, --model <model>`: Optional flag to set the model, defaults to `gpt-3.5-turbo-0613`. Using the value "gpt4" will use the `gpt-4-0613` model.
- `-d, --dry-run`: Optional boolean flag that can be used to run the tool in dry-run mode where only the prompt that will be sent to the model is displayed. No changes are made to your filesystem when this option is used.
- `-i, --interactive`: Optional boolean flag that enables interactive mode where the user can provide input interactively. If this flag is not set, the tool runs in non-interactive mode.
- `-p, --prompt <prompt>`: Optional string flag that specifies the prompt to use in non-interactive mode. If this flag is not set then a blank prompt is used. A path or a url can also be specified - in this case the content at the specified path or url is used as the prompt. The prompt is combined with the tempate to form the payload sent to the model.
- `-t, --template <templateName | templatePath | templateUrl>`: Optional string flag that specifies a built in template name, the absolute path to a template file, or a url for a template file that will be used to generate the output. The default is the  built in `refactor` template. The available built in templates are: `empty`, `refactor`, `swe`, and `test-first`. The prompt is interpolated with the template to form the payload sent to the model.
- `-x` Optional boolean flag. Promptr parses the model's response and applies the resulting operations to your file system when using the default template. You only need to pass the `-x` flag if you've created your own template, and you want Promptr to parse and apply the output in the same way that the built in "refactor" template output is parsed and applied to your file system. 
- `-o, --output-path <outputPath>`: Optional string flag that specifies the path to the output file. If this flag is not set, the output will be printed to stdout.
- `-v, --verbose`: Optional boolean flag that enables verbose output, providing more detailed information during execution.
- `-dac, --disable-auto-context`: Prevents files referenced in the prompt from being automatically included in the context sent to the model.
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
