require('dotenv-defaults').config()
const rabbitMq = require('amqplib')
const {initExchangeConsumer, initExchangeProducer} = require('@badgrhammer/rabbitmq-helpers')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env

const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}?heartbeat=5` 

console.log('====================')
console.log(connectionString)
console.log('====================')

class Queue {
  constructor() {
    this.initProducer()
    this.initConsumer()
    this.isProducerErrorState = false
    this.isConsumerErrorState = false
  }
  async initProducer() {
    try {
      this.producer = await initExchangeProducer({
        rabbitMq,
        connectionString,
        exchange: EXCHANGE
      })
      this.isProducerErrorState = false
      this.producer.on('close',(err) => {
        console.warn('Queue Producer:', err)
        this.isProducerErrorState = true
        this.initProducer()
      })
    }
    catch (err) {
      console.warn('Queue Producer:', err)
      this.isProducerErrorState = true
      setTimeout(() => this.initProducer(),1000)
    }
  }

  async initConsumer() {
    try {
      const {channel, queue} = await initExchangeConsumer({
        rabbitMq,
        connectionString,
        topic: 'my.control-response',
        exchange: EXCHANGE
      })
      this.consumer = channel
      this.consumer.consume(queue, (message) => {
        if (message !== null) {
          putMessage(message)
          // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
          // however for development simplicity we'll just save messages and acknowledge them immediately
          consumer.ack(message)
        }
      })
      this.isConsumerErrorState = false
      this.consumer.on('close',(err) => {
        console.warn('Queue Consumer:', err)
        this.isConsumerErrorState = true
        this.initConsumer()
      })
    }
    catch (err) {
      console.warn('Queue Consumer:', err)
      this.isConsumerErrorState = true
      setTimeout(() => this.initConsumer(),1000)
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
  waitForProducerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isProducerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  waitForConsumerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isConsumerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  async publishMessage(message) {
    if (this.isProducerErrorState) {
      await this.waitForProducerResolved()
    }
    return this.producer.publish(EXCHANGE,'my.control-request', Buffer.from(message))  
  }
}

const queue = new Queue()

/**
 * @description a local store for received messages
 */
const messages = {}

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
 */
async function sendMessage({timestamp, id, payload}) {
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
  return publishMessage(message)
}

/**
 * @private
 * @description publishes a message to rabbitMQ, in tests env return
 */
async function publishMessage(message) {
  if (ENV === 'test') {
    return // mocking rabbitmq for testing purposes is not worth the effort at this time
  }
  return queue.publishMessage(message)
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