require('dotenv-defaults').config()
const expect = require('expect')
const Orig = require('./index')
const sinon = require('sinon')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')


let orig = {}

describe('===== ORIG =====', () => {


  beforeEach(() => {
    orig = new Orig()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Orig()).not.toThrow()
    })    
  })

  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      orig.initQueue()
      expect(orig.queue).toMatchObject(mockQueue)
    })
  })

  describe('==== messaging ====', () => {
    it('Should handle a message sent from the queue', () => {
      const spy = sinon.spy(orig,'handleMessage')
      console.table(orig.handleMessage)
      const message = JSON.stringify({id:1, payload:'TEST', timestamp:1})
      mockQueue.mockReceivedFanoutMessage({message})
      sinon.assert.calledOnceWithExactly(spy,{id:1, payload:'TEST', timestamp:1})
      spy.restore()
    })
    it('Should handle a SHUTDOWN sent from the queue', () => {
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'SHUTDOWN', timestamp:1}
      orig.handleMessage(message)
      sinon.assert.calledOnceWithExactly(spy,{message:JSON.stringify(message), topic:'control-response'})
      spy.restore()
    })
  })

})