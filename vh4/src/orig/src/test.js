require('dotenv-defaults').config()
const expect = require('expect')
const Orig = require('./class')
const sinon = require('sinon')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')


let orig = {}

describe('===== ORIG =====', () => {


  beforeEach(() => {
    orig = new Orig()
  })

  afterEach(() => {
    orig.stopSendingMessages()
    orig = undefined
  })


  
  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Orig()).not.toThrow()
    })
    it('Should set default state to be RUNNING', async() => {
      expect(orig.state).toEqual('RUNNING')
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
      mockQueue.mockReceivedFanoutMessage({id:1, payload:'TEST', timestamp:1})
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
    
    it('Should keep sending messages in RUNNING state after INIT sent from the queue', (done) => {
      orig = new Orig({messageIntervalTime:100})
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'INIT', timestamp:1}
      orig.handleMessage(message)
      setTimeout(() => {
        sinon.assert.calledWith(spy,{message:JSON.stringify(message), topic:'control-response'})
        sinon.assert.calledWith(spy, {message:'MSG_1',topic:'my.o'})
        spy.restore()
        done()
      },100)
    })

    it('Should start sending messages after INIT sent from the queue', (done) => {
      orig = new Orig({messageIntervalTime:100})
      orig.stopSendingMessages()
      orig.state = 'SHUTDOWN'
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'INIT', timestamp:1}
      orig.handleMessage(message)
      setTimeout(() => {
        sinon.assert.calledWith(spy,{message:JSON.stringify(message), topic:'control-response'})
        sinon.assert.calledWith(spy, {message:'MSG_1',topic:'my.o'})
        spy.restore()
        done()
      },100)
    })

    it('Should start sending messages after RUNNING sent from the queue', (done) => {
      orig = new Orig({messageIntervalTime:100})
      orig.stopSendingMessages()
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'RUNNING', timestamp:1}
      orig.handleMessage(message)
      setTimeout(() => {
        sinon.assert.calledWith(spy,{message:JSON.stringify(message), topic:'control-response'})
        sinon.assert.calledWith(spy, {message:'MSG_1',topic:'my.o'})
        spy.restore()
        done()
      },100)
    })

    it('Should return error after RUNNING sent from the queue if state is SHUTDOWN', (done) => {
      orig = new Orig({messageIntervalTime:100})
      orig.stopSendingMessages()
      orig.state = 'SHUTDOWN'
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      const message = {id:1, payload:'RUNNING', timestamp:1}
      orig.handleMessage(message)
      setTimeout(() => {
        const newMessage = {...message, error:new Error('Cannot set to running when shutdown').toString()}
        sinon.assert.calledWithExactly(spy,{message:JSON.stringify(newMessage), topic:'control-response'})
        spy.restore()
        done()
      },200)
    })

    it('Should pause sending messages after PAUSE sent from the queue', (done) => {
      orig = new Orig({messageIntervalTime:200})
      const message = {id:1, payload:'PAUSE', timestamp:1}
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      orig.handleMessage(message)
      setTimeout(() => {
        sinon.assert.calledOnceWithExactly(spy,{message:JSON.stringify(message), topic:'control-response'})
        spy.restore()
        done()
      },100)
    })
    
    it('Should fail to pause when state is shutdown after PAUSE sent from the queue', (done) => {
      orig = new Orig({messageIntervalTime:200})
      orig.state = 'SHUTDOWN'
      const message = {id:1, payload:'PAUSE', timestamp:1}
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      orig.handleMessage(message)
      setTimeout(() => {
        const newMessage = {...message, error:new Error('Cannot pause when shutdown').toString()}
        sinon.assert.calledOnceWithExactly(spy,{message:JSON.stringify(newMessage), topic:'control-response'})
        spy.restore()
        done()
      },100)
    })

    it('Should start sending messages on init', () => {
      expect(orig.messageInterval).toBeDefined()
    })

    it('Should stop sending messages', (done) => {
      orig = new Orig({messageIntervalTime:200})
      orig.stopSendingMessages()
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      setTimeout(() => {
        sinon.assert.notCalled(spy)
        spy.restore()
        done()
      },200)
    })

    it('Should start sending messages after stopping', (done) => {
      orig = new Orig({messageIntervalTime:100})
      orig.stopSendingMessages()
      orig.startSendingMessages()
      const spy = sinon.spy(mockQueue,'publishTopicMessage')
      setTimeout(() => {
        const message = 'MSG_1'
        const topic = 'my.o'
        sinon.assert.calledOnceWithExactly(spy, {message,topic})
        spy.restore()
        done()
      },100)
    })
  })

})