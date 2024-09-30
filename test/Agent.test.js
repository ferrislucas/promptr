import assert from 'assert';
import sinon from 'sinon';
import Agent from '../src/services/Agent.js';
import ChatService from '../src/services/ChatService.js';

describe('Agent', () => {
  describe('call method', () => {
    let chatServiceStub;

    beforeEach(() => {
      chatServiceStub = sinon.stub(ChatService.prototype, 'call').resolves();
    });

    afterEach(() => {
      chatServiceStub.restore();
    });

    it('should initialize ChatService and call its call method', async () => {
      await Agent.call('test plan');
      assert(chatServiceStub.calledOnce);
    });
  });
});
