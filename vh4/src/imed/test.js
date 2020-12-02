const expect = require('expect')
const Imed = require('./index')
const sinon = require('sinon')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')

describe('===== IMED =====', () => {
  beforeEach(() => {
    imed = new Imed()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Imed()).not.toThrow()
    })
    it('Should set default state to be RUNNING', async() => {
      expect(imed.state).toEqual('RUNNING')
    })    
  })
  
  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      imed.initQueue()
      expect(imed.queue).toMatchObject(mockQueue)
    })
  })

  describe('==== messaging ====', () => {

    it('Should handle a message sent from the queue', () => {
      const spy = sinon.spy(imed,'handleMessage')
      mockQueue.mockReceivedFanoutMessage({id:1, payload:'TEST', timestamp:1})
      sinon.assert.calledOnceWithExactly(spy,{id:1, payload:'TEST', timestamp:1})
      spy.restore()
    })

    it('Should handle a SHUTDOWN sent from the queue', () => {
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'SHUTDOWN', timestamp:1}
      imed.handleMessage(message)
      sinon.assert.calledOnceWithExactly(spy,{message:JSON.stringify(message), topic:'control-response'})
      spy.restore()
    })

  })
})