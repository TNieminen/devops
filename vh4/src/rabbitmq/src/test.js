const expect = require('expect')
const Queue = require('./index')
const rabbit = require('./rabbit')
const sinon = require('sinon')

const rabbitConfig = {
  EXCHANGE:'TEST_EXCHANGE',
  CONNECTION_STRING:'TEST_CONNECTIONSTRING'
}

let stubTopicProducer
let stubTopicConsumer
let stubFanoutProducer
let stubFanoutConsumer
let queue

const producerMock = {
  on:() => {},
  publish: () => new Promise((resolve,reject) => resolve())
}

const consumerMock = {
  channel:{
    on:() => {},
    messageCallback:undefined,
    consume: (queue, callback) => {
      this.messageCallback = callback
    },
    fakeReceivedMessage(message) {
      this.messageCallback(message)
    },
    ack:() => {}
  },
  queue:'TEST_QUEUE'
}



describe('===== APIGATEWAY State Queue - Unit Tests =====', () => {

  beforeEach(() => {
    stubTopicProducer = sinon.stub(rabbit,'initTopicProducer')
    stubTopicConsumer = sinon.stub(rabbit,'initTopicConsumer')
    stubFanoutProducer = sinon.stub(rabbit,'initFanoutProducer')
    stubFanoutConsumer = sinon.stub(rabbit,'initFanoutConsumer')
    stubTopicProducer.returns(producerMock)
    stubTopicConsumer.returns(consumerMock)
    stubFanoutProducer.returns(producerMock)
    stubFanoutConsumer.returns(consumerMock)
    queue = new Queue({rabbitConfig, topicConsumer:{topic:'test-topic'}, topicProducer:true, fanoutConsumer:true, fanoutProducer:true})
  })
  afterEach(() => {
    stubTopicProducer.restore()
    stubTopicConsumer.restore()
    stubFanoutProducer.restore()
    stubFanoutConsumer.restore()
  })
  
  describe('==== Queue Constructor ====', () => {

    it('Should fail creating queue without valid exchange', () => {
      const tmpConfig = JSON.parse(JSON.stringify(rabbitConfig))
      delete tmpConfig['EXCHANGE']
      return expect(() => new Queue({rabbitConfig:tmpConfig})).toThrowError(new Error('Queue requires config key EXCHANGE'))
    })

    it('Should fail creating queue without valid connection string', () => {
      const tmpConfig = JSON.parse(JSON.stringify(rabbitConfig))
      delete tmpConfig['CONNECTION_STRING']
      return expect(() => new Queue({rabbitConfig:tmpConfig})).toThrowError(new Error('Queue requires config key CONNECTION_STRING'))
    })

    it('Should fail creating queue without topic defined for topicConsumer', () => {
      const tmpConfig = JSON.parse(JSON.stringify(rabbitConfig))
      const topicConsumer = {}
      return expect(() => new Queue({rabbitConfig:tmpConfig, topicConsumer})).toThrowError(new Error('TopicConsumer requires a defined topic'))
    })

  })


  describe('==== QUEUE putMessage ====', () => {

    it('Should return messages object that contains our message', () => {
      const message = '{"id":1, "payload":"TEST", "timestamp":1}'
      expect(queue.putMessage({content:message})).toMatchObject({1:{payload:'TEST', timestamp:1}})
    })

    it('Should throw an error if message cannot be parsed', () => {
      const message = undefined
      expect(() => queue.putMessage({content:message})).toThrow()
    })

  })

  describe('==== QUEUE getMessageById ====', () => {

    it('Should return payload if id exists in messages', () => {
      queue.messages[1] = 'TEST'
      expect(queue.getMessageById(1)).toEqual('TEST')
    })

    it('Should return undefined if message with id does not exist', () => {
      expect(queue.getMessageById(2)).toEqual(undefined)
    })

  })

  describe('==== QUEUE clearMessages ====', () => {
    it('Should clear messages', () => {
      queue.messages[1] = 'TEST'
      const messages = queue.clearMessages()
      expect(messages).toEqual({})
    })
  
  })
  describe('==== QUEUE publishTopicMessage ====', () => {
    it('Should publish topic message', async() => {
      return expect(await queue.publishTopicMessage({message:'TEST_MESSAGE', topic:'TEST_TOPIC'})).resolves
    })
    it('Should not publish topic message without message', async() => {
      return expect(queue.publishTopicMessage({topic:'TEST_TOPIC'})).rejects.toEqual(new Error('Cannot publish topic message without message'))
    })
    it('Should not publish topic message without topic', () => {
      return expect(queue.publishTopicMessage({message:'TEST_MESSAGE'})).rejects.toEqual(new Error('Cannot publish topic message without topic'))
    })
  })

  describe('==== QUEUE publishFanoutMessage ====', () => {
    it('Should publish fanout message', async() => {
      return expect(await queue.publishFanoutMessage({message:'TEST_MESSAGE'})).resolves
    })
    it('Should not publish fanout message without message', async() => {
      return expect(queue.publishFanoutMessage({})).rejects.toEqual(new Error('Cannot publish fanout message without message'))
    })
  })

  

  // describe('==== QUEUE clearMessages ====', () => {
  //   it('Should clear all messages', () => {
  //     queue.messages[1] = 'TEST'
  //     expect(queue.clearMessages()).toEqual({})
  //   })
  // })
  
  
})