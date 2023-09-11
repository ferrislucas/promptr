import assert from 'assert'
import { ExtractOperationsService } from '../src/services/ExtractOperationsService.js'

describe('ExtractOperationsService', () => {
  describe('call method', () => {
    const testCases = [
      {
        input: '{"key": "value"}',
        expectedOutput: { key: 'value' },
        description: 'Simple JSON object'
      },
      {
        input: 'random text {"key": "value"} more text',
        expectedOutput: { key: 'value' },
        description: 'JSON object with surrounding text'
      },
      {
        input: '[{"key": "value1"}, {"key": "value2"}]',
        expectedOutput: [{ key: 'value1' }, { key: 'value2' }],
        description: 'Simple JSON array'
      },
      {
        input: 'random text [{"key": "value1"}, {"key": "value2"}] more text',
        expectedOutput: [{ key: 'value1' }, { key: 'value2' }],
        description: 'JSON array with surrounding text'
      },
      {
        input: 'this is not a JSON object or array',
        expectedOutput: null,
        description: 'No JSON object or array in the input string'
      },
      {
        input: '{"key": "value" broken JSON',
        expectedOutput: null,
        description: 'Invalid JSON object'
      }
    ]
  
    testCases.forEach((testCase) => {
      it(testCase.description, () => {
        const result = ExtractOperationsService.call(testCase.input)
        assert.deepStrictEqual(result, testCase.expectedOutput)
      })
    })

    it('corrects the triple quote fileContents delimeter issue', () => {
      const invalidJson = `{
        "operations": [
            {
                "crudOperation": "update",
                "filePath": "my-script.py",
                "fileContents": """file content"""
            }
        ]
    }
    `
      const expectedOutput = {
        "operations": [
          {
            "crudOperation": "update",
            "filePath": "my-script.py",
            "fileContents": "file content"
          }
        ]
      }
      const result = ExtractOperationsService.call(invalidJson)
      assert.deepStrictEqual(result, expectedOutput)
    })

    it('corrects issue where ending triple quote fileContents delimeter is preceded by a line break', () => {
      const invalidJson = `{
        "operations": [
            {
                "crudOperation": "update",
                "filePath": "my-script.py",
                "fileContents": """file content
"""
            }
        ]
    }
    `
      const expectedOutput = {
        "operations": [
          {
            "crudOperation": "update",
            "filePath": "my-script.py",
            "fileContents": "file content\n"
          }
        ]
      }
      const result = ExtractOperationsService.call(invalidJson)
      assert.deepStrictEqual(result, expectedOutput)
    })

    it('corrects issue where starting triple quote fileContents delimeter is followed by a line break', () => {
      const invalidJson = `{
        "operations": [
            {
                "crudOperation": "update",
                "filePath": "my-script.py",
                "fileContents": """
file content"""
            }
          ]
      }
      `
      const expectedOutput = {
        "operations": [
          {
            "crudOperation": "update",
            "filePath": "my-script.py",
            "fileContents": "\nfile content"
          }
        ]
      }
      const result = ExtractOperationsService.call(invalidJson)
      assert.deepStrictEqual(result, expectedOutput)
    })

    it('corrects issue where fileContents delimeter is triple quotes and content does not have line breaks escaped', () => {
      const invalidJson = `{
        "operations": [
            {
                "crudOperation": "update",
                "filePath": "my-script-A.py",
                "fileContents": """file content line 1
file content line 2"""
            },
            {
              "crudOperation": "update",
              "filePath": "my-script-B.py",
              "fileContents": """file content line A
file content line B"""
          }
          ]
      }
      `
      const expectedOutput = {
        "operations": [
          {
            "crudOperation": "update",
            "filePath": "my-script-A.py",
            "fileContents": "file content line 1\nfile content line 2"
          },
          {
            "crudOperation": "update",
            "filePath": "my-script-B.py",
            "fileContents": "file content line A\nfile content line B"
          }
        ]
      }
      const result = ExtractOperationsService.call(invalidJson)
      assert.deepStrictEqual(result, expectedOutput)
    })

  })
})
