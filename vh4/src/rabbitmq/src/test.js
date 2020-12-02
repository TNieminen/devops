const expect = require('expect')
const Queue = require('./index')
const rabbit = require('./rabbit')
const sinon = require('sinon')

const rabbitConfig = {
  FANOUT_EXCHANGE:'FANOUT_EXCHANGE',
  TOPIC_EXCHANGE:'TOPIC_EXCHANGE',
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

const messageEmit = sinon.spy()


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
    queue.on('message', message => messageEmit(message))
  })
  afterEach(() => {
    stubTopicProducer.restore()
    stubTopicConsumer.restore()
    stubFanoutProducer.restore()
    stubFanoutConsumer.restore()
    messageEmit.resetHistory()
  })
  
  describe('==== Queue Constructor ====', () => {

    it('Should fail creating queue without valid fanout exchange', () => {
      const tmpConfig = JSON.parse(JSON.stringify(rabbitConfig))
      delete tmpConfig['FANOUT_EXCHANGE']
      return expect(() => new Queue({rabbitConfig:tmpConfig, fanoutConsumer:true})).toThrowError(new Error('Queue requires config key FANOUT_EXCHANGE'))
    })

    it('Should fail creating queue without valid topic exchange', () => {
      const tmpConfig = JSON.parse(JSON.stringify(rabbitConfig))
      delete tmpConfig['TOPIC_EXCHANGE']
      return expect(() => new Queue({rabbitConfig:tmpConfig, topicConsumer:{topic:'TEST'}})).toThrowError(new Error('Queue requires config key TOPIC_EXCHANGE'))
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

    it('Should return messages object that contains our fanout message', () => {
      const message = '{"id":1, "payload":"TEST", "timestamp":1}'
      expect(queue.putMessage({content:message},type = 'fanout')).toMatchObject({1:{payload:'TEST', timestamp:1}})
      expect(messageEmit.calledWith(JSON.parse(message)))
    })

    it('Should throw an error if message cannot be parsed', () => {
      const message = undefined
      expect(() => queue.putMessage({content:message}, type = 'fanout')).toThrow()
      expect(messageEmit.notCalled)
    })

    it('Should return a messages object that contains our topic object', () => {
      // there is no requirement to store topic messages, hence we are not storing these into messages or assigning a unique id
      const message = Buffer.from('TEST')
      queue.putMessage({fields:{routingKey:'my.o'},content:message},type = 'topic')
      expect(messageEmit.calledWith({payload:'my.o', message:'TEST'}))
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

  describe('==== QUEUE start&stop ReceivingTopicMessages ====', () => {
    it('Should by default be receiving topic message fanout message', () => {
      expect(queue.receiveTopicMessages).toEqual(true)
    })
    it('Should stop receiving topic messages', () => {
      queue.stopReceivingTopicMessages()
      expect(queue.receiveTopicMessages).toEqual(false)
    })
    it('Should start receiving topic messages', () => {
      queue.receiveTopicMessages = false
      queue.startReceivingTopicMessages()
      expect(queue.receiveTopicMessages).toEqual(true)
    })
  })  
})