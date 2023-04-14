import assert from 'assert'
import Main from '../src/main.js'
import PluginService from '../src/services/pluginService.js'
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

  it('should pass the expected prompt to PluginService.call when prompt is a URL', async () => {
    const url = 'https://example.com/test.txt'
    const content = 'This is a test content from URL.'
    fsExistsMock.withArgs(sinon.match(/empty.txt/)).returns(true)
    const fetchMock = sinon.stub(global, 'fetch')
    fetchMock.withArgs(sinon.match(url)).resolves({ text: () => content })
    const pluginServiceSpy = sinon.spy(PluginService, 'call')

    await Main.call(['node', 'main.js', '-p', url, '-d', '-t', 'empty'])

    assert.strictEqual(pluginServiceSpy.calledWith(content), true)
    fetchMock.restore()
    pluginServiceSpy.restore()
  });

  it('should pass the expected prompt to PluginService.call when prompt is a file path', async () => {
    const filePath = './test-file.txt'
    const content = 'This is a test content file.'
    readFileSyncMock.withArgs(filePath).returns(content)    
    fsExistsMock.withArgs(sinon.match(filePath)).returns(true)
    fsExistsMock.withArgs(sinon.match(/empty.txt/)).returns(true)

    const pluginServiceSpy = sinon.spy(PluginService, 'call')

    await Main.call(['node', 'main.js', '-p', filePath, '-d', '-t', 'empty'])

    assert.strictEqual(pluginServiceSpy.calledWith(content), true)
    pluginServiceSpy.restore()
  })

  it('should pass the expected prompt to PluginService.call when prompt is a file path with ~', async () => {
    const filePath = "~/test-file.txt";
    const content = "This is test content."
    
    const expectedPath = path.join(os.homedir(), "test-file.txt")
    fsExistsMock.withArgs(sinon.match(expectedPath)).returns(true)
    fsExistsMock.withArgs(sinon.match(/empty.txt/)).returns(true)
    readFileSyncMock.withArgs(sinon.match(expectedPath)).returns(content)
    const pluginServiceSpy = sinon.spy(PluginService, 'call')

    await Main.call(['node', 'main.js', '-p', filePath, "-d", '-t', 'empty'])

    assert.strictEqual(pluginServiceSpy.calledWith(content), true)    
    pluginServiceSpy.restore()
  })
  
})
