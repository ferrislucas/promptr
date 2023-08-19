import assert from 'assert'
import { extractOperationsFromOutput } from '../src/services/ExtractOperationsFromOutput.js'

describe('extractOperationsFromOutput', () => {
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
      const result = extractOperationsFromOutput(testCase.input)
      assert.deepStrictEqual(result, testCase.expectedOutput)
    })
  })
})