require('dotenv-defaults').config()
const rabbitMq = require('amqplib')
const {initTopicConsumer, initTopicProducer, initFanoutConsumer, initFanoutProducer} = require('@badgrhammer/rabbitmq-helpers')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env

const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}?heartbeat=5` 

/**
 * @description a local store for received messages
 */
const messages = {}

class Queue {
  constructor() {
    if (ENV !== 'test') {
      this.initTopicProducer()
      this.initTopicConsumer()  
    }
    this.isTopicProducerErrorState = true
    this.isTopicConsumerErrorState = true
    this.isFanoutProducerErrorState = true
    this.isFanoutConsumerErrorState = true
  }

  async initFanoutConsumer() {
    try {
      const {channel, queue} = await initFanoutConsumer({
        rabbitMq,
        connectionString,
        topic: '',
        exchange: EXCHANGE
      })
      this.fanoutConsumer = channel
      this.fanoutConsumer.consume(queue, (message) => {
        if (message !== null) {
          putMessage(message)
          // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
          // however for development simplicity we'll just save messages and acknowledge them immediately
          this.fanoutConsumer.consumer.ack(message)
        }
      })
      this.isFanoutConsumerErrorState = false
      this.fanoutConsumer.on('close',(err) => {
        console.warn('Queue TopicConsumer:', err)
        this.isFanoutConsumerErrorState = true
        this.initFanoutConsumer()
      })
    }
    catch (err) {
      console.warn('Queue FanoutConsumer:', err)
      this.isFanoutConsumerErrorState = true
      setTimeout(() => this.initFanoutConsumer(),1000)
    }
  }

  async initFanoutProducer() {
    try {
      this.fanoutProducer = await initFanoutProducer({
        rabbitMq,
        connectionString,
        exchange: EXCHANGE
      })
      this.isFanoutProducerErrorState = false
      this.fanoutProducer.on('close',(err) => {
        console.warn('Queue FanoutProducer:', err)
        this.isFanoutProducerErrorState = true
        this.initFanoutProducer()
      })
    }
    catch (err) {
      console.warn('Queue FanoutProducer:', err)
      this.isFanoutProducerErrorState = true
      setTimeout(() => this.initFanoutProducer(),1000)
    }
  }

  async initTopicProducer() {
    try {
      this.topicProducer = await initTopicProducer({
        rabbitMq,
        connectionString,
        exchange: EXCHANGE
      })
      this.isTopicProducerErrorState = false
      this.topicProducer.on('close',(err) => {
        console.warn('Queue TopicProducer:', err)
        this.isTopicProducerErrorState = true
        this.initTopicProducer()
      })
    }
    catch (err) {
      console.warn('Queue TopicProducer:', err)
      this.isTopicProducerErrorState = true
      setTimeout(() => this.initTopicProducer(),1000)
    }
  }

  async initTopicConsumer() {
    try {
      const {channel, queue} = await initTopicConsumer({
        rabbitMq,
        connectionString,
        topic: 'my.control-response',
        exchange: EXCHANGE
      })
      this.topicConsumer = channel
      this.topicConsumer.consume(queue, (message) => {
        if (message !== null) {
          putMessage(message)
          // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
          // however for development simplicity we'll just save messages and acknowledge them immediately
          this.topicConsumer.consumer.ack(message)
        }
      })
      this.isTopicConsumerErrorState = false
      this.topicConsumer.on('close',(err) => {
        console.warn('Queue TopicConsumer:', err)
        this.isTopicConsumerErrorState = true
        this.initTopicConsumer()
      })
    }
    catch (err) {
      console.warn('Queue TopicConsumer:', err)
      this.isTopicConsumerErrorState = true
      setTimeout(() => this.initTopicConsumer(),1000)
    }
  }

  /**
   * @description amqplib does not handle reconnections well and
   * it is likely that if rabbitmq hasn't been running we willl experience
   * ECONNRESET or Socket closed abruptly during opening handshake errors.
   * In order to prevent messages from being lost, we can wait in a loop until
   * the problem resolves. This can effectively be an infinite loop, so a more elegant
   * solution would be to either time the Docker setup or alternatively maybe just enforce
   * absolute amount of tries before failing the request
   */
  waitForTopicProducerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isTopicProducerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  waitForFanoutProducerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isFanoutProducerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  async publishTopicMessage(message) {
    if (this.isTopicProducerErrorState) {
      await this.waitForTopicProducerResolved()
    }
    return this.producer.publish(EXCHANGE,'my.control-request', Buffer.from(message))  
  }

  async publishFanoutMessage(message) {
    if (this.isFanoutProducerErrorState) {
      await this.waitForFanoutProducerResolved()
    }
    // we don't define a topic on fanout mode
    return this.producer.publish(EXCHANGE,'', Buffer.from(message))  
  }

}

const queue = new Queue()


/**
 * @description saves a message to local state
 * @param {{content:'{id, payload, timestamp}'}} msg
 */
function putMessage(msg) {
  const message = JSON.parse(msg.content)
  const {id, payload, timestamp} = message
  messages[`${id}`] = {payload, timestamp}
  return messages
}

/**
 * @description gets a message from local state by message id
 */
function getMessageById(id) {
  return messages[`${id}`]
}

/**
 * @description sends control message to queue service with id
 * - if type is set to fanout messages are delivered to all services
 * - if type is set to topic, only services subscribed to that topic receive the message
 */
async function sendMessage({timestamp, id, payload, type}) {
  if (!id) {
    throw new Error('Queue message has to have and id')
  }
  if (!payload) {
    throw new Error('Cannot send message without payload')
  }
  if (!timestamp || !Number.isInteger(timestamp)) {
    throw new Error('Cannot send message without valid timestamp')
  }
  const message = JSON.stringify({id, payload, timestamp})
  return publishMessage(message, type)  
  
}

/**
 * @private
 * @description publishes a message to rabbitMQ, in tests env return
 */
async function publishMessage(message, type) {
  if (type !== 'fanout' && type !== 'topic') {
    throw new Error('Message type needs to either topic or fanout')
  }
  if (ENV === 'test') {
    return // mocking rabbitmq for testing purposes is not worth the effort at this time
  }
  if (type === 'topic') {
    return queue.publishTopicMessage(message)
  }
  return queue.publishFanoutMessage(message)
  
}

function clearMessages() {
  Object.keys(messages).forEach(key => delete messages[`${key}`])
  return messages
}

module.exports = {
  putMessage,
  getMessageById,
  sendMessage,
  messages,
  clearMessages
}