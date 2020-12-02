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
      const message = JSON.stringify({payload:'TEST', timestamp:1})
      mockQueue.publishFanoutMessage({message})
      expect(spy.calledOnceWith({payload:'TEST', timestamp:1}))
    })
  })

})