import assert from 'assert';
import sinon from 'sinon';
import Agent from '../src/services/Agent.js';
import ChatService from '../src/services/ChatService.js';
import CliState from '../src/CliState.js';

describe('Agent', () => {
  describe('call method', () => {
    let chatServiceStub;
    let cliStateStub;

    beforeEach(() => {
      chatServiceStub = sinon.stub(ChatService.prototype, 'call').resolves();
      cliStateStub = sinon.stub(CliState, 'planPath').returns('test plan path');
    });

    afterEach(() => {
      chatServiceStub.restore();
      cliStateStub.restore();
    });

    it('should initialize ChatService and call its call method', async () => {
      await Agent.call('test plan')
      assert(chatServiceStub.calledOnce)
    });
  });
});
