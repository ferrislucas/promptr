import assert from 'assert'
import Main from '../src/Main.js'
import PromptrService from '../src/services/PromptrService.js'
import sinon from 'sinon'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Main', () => {
  let fsExistsMock
  let readFileSyncMock

  before(function () {
    fsExistsMock = sinon.stub(fs, 'existsSync')
    readFileSyncMock = sinon.stub(fs, 'readFileSync')
  })

  after(function () {
    fsExistsMock.restore()
    readFileSyncMock.restore()
    sinon.restore()
  })


  it('should get user input correctly', async () => {
    const rlMock = {
      question: (prompt, callback) => {
        callback('test input')
      }
    }
    const result = await Main.getUserInput(rlMock)
    assert.strictEqual(result, 'test input')
  })

  it('should pass the expected prompt to PromptrService.call when prompt is a URL', async () => {
    const url = 'https://example.com/prompt.txt'
    const templateUrl = 'https://example.com/template.txt'
    const content = 'This is a test content from URL.'

    const fetchMock = sinon.stub(global, 'fetch')
    fetchMock.withArgs(sinon.match(url)).resolves({ text: () => content })
    fetchMock.withArgs(sinon.match(templateUrl)).resolves({ text: () => "stub template content" })
    const PromptrServiceSpy = sinon.spy(PromptrService, 'call')

    await Main.call(['node', 'Main.js', '-p', url, '-d', '-t', templateUrl])

    assert.strictEqual(PromptrServiceSpy.calledWith(content), true)
    fetchMock.restore()
    PromptrServiceSpy.restore()
  });

  it('should pass the expected prompt to PromptrService.call when prompt is a file path', async () => {
    const filePath = './test-file.txt'
    const content = 'This is a test content file.'
    readFileSyncMock.withArgs(filePath).returns(content)    
    fsExistsMock.withArgs(sinon.match(filePath)).returns(true)
    fsExistsMock.withArgs(sinon.match(/empty.txt/)).returns(true)

    const PromptrServiceSpy = sinon.spy(PromptrService, 'call')

    await Main.call(['node', 'Main.js', '-p', filePath, '-d', '-t', 'empty'])

    assert.strictEqual(PromptrServiceSpy.calledWith(content), true)
    PromptrServiceSpy.restore()
  })

  it('should pass the expected prompt to PromptrService.call when prompt is a file path with ~', async () => {
    const filePath = "~/test-file.txt";
    const content = "This is test content."
    
    const expectedPath = path.join(os.homedir(), "test-file.txt")
    fsExistsMock.withArgs(sinon.match(expectedPath)).returns(true)
    fsExistsMock.withArgs(sinon.match(/empty.txt/)).returns(true)
    readFileSyncMock.withArgs(sinon.match(expectedPath)).returns(content)
    const PromptrServiceSpy = sinon.spy(PromptrService, 'call')

    await Main.call(['node', 'Main.js', '-p', filePath, "-d", '-t', 'empty'])

    assert.strictEqual(PromptrServiceSpy.calledWith(content), true)    
    PromptrServiceSpy.restore()
  })
  
})
