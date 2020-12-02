const expect = require('expect')
const Obse = require('./')
const sinon = require('sinon')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')

let obse
describe('===== OBSE =====', () => {

  beforeEach(() => {
    obse = new Obse()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Obse()).not.toThrow()
    })
    it('Should set default state to be RUNNING', async() => {
      expect(obse.state).toEqual('RUNNING')
    })    
  })
  
  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      obse.initQueue()
      expect(obse.queue).toMatchObject(mockQueue)
    })
  })

  describe('==== messaging ====', () => {

    it('Should handle a message sent from the queue', () => {
      const spy = sinon.spy(obse,'handleMessage')
      mockQueue.mockReceivedFanoutMessage({id:1, payload:'TEST', timestamp:1})
      sinon.assert.calledOnceWithExactly(spy,{id:1, payload:'TEST', timestamp:1})
      spy.restore()
    })
    
    it('Should handle a SHUTDOWN sent from the queue', () => {
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'SHUTDOWN', timestamp:1}
      obse.handleMessage(message)
      sinon.assert.calledOnceWithExactly(spy,{message:JSON.stringify(message), topic:'control-response'})
      spy.restore()
    })

  })


})