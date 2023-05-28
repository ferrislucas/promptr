import assert from 'assert';
import AutoContext from '../src/services/AutoContext.js';


describe('AutoContext.call', () => {
  let prompt = 'test prompt'

  it('returns empty array if there are no paths mentioned in the prompt', () => {
    const result = AutoContext.call(prompt)
    assert.deepStrictEqual([], result)
  })

  describe('when the prompt mentions a path', () => {
    let prompt = 'add a new method to the class in src/services/AutoContext.js'

    it('returns an array of paths mentioned in the prompt', () => {
      const result = AutoContext.call(prompt)
      assert.deepStrictEqual(['src/services/AutoContext.js'], result)
    })
  })

  describe('when the prompt mentions multiple paths', () => {
    let prompt = 'add a new method to the class in src/services/AutoContext.js - also, do the same for the class in src/services/AnotherClass.js'

    it('returns an array of paths mentioned in the prompt', () => {
      const result = AutoContext.call(prompt)
      assert.deepStrictEqual([
        'src/services/AutoContext.js',
        'src/services/AnotherClass.js',
    ], result)
    })
  })
})
