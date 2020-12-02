require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const pino = require('pino')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, DOCKER, LOGLEVEL} = process.env

const logger = pino({level: LOGLEVEL || 'error'})
const serverUrl = DOCKER ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = DOCKER ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 
const waitUntilSendMessage = ENV === 'test' ? 10 : 1000 // we want to speed up our testing process

const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  TOPIC_EXCHANGE,
  FANOUT_EXCHANGE,
  CONNECTION_STRING:connectionString
}

module.exports = class Imed {
  /**
   * @description class implementation to support receiving and sending messages
   * outlined in README
   */
  constructor() {
    this.state = 'RUNNING'    
    this.initQueue()
    this.initListeners()
  }
  
  /**
   * @private
   * @description initializes queue, in test environment we use a mock queue
   */
  initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, topicConsumer:{topic:'my.o'}, fanoutConsumer:true})
    }
  }

  /**
   * @private
   * @description initialize listeners for messages from queue
   */
  initListeners() {
    this.queue.on('message',(message) => {
      this.handleMessage(message)
    })
  }

  /**
   * @private
   * @description a message handler to route messages based on type
   */
  handleMessage(message) {
    const {payload} = message
    switch (payload) {
      case 'SHUTDOWN':
        this.handleShutdown(message)
        break
      case 'INIT':
        this.handleInit(message)
        break
      case 'my.o':
        this.handleMyo(message)
        break
      default:
        console.warn('Received message without handler', message)
        break
    }
  }

  /**
   * @private
   * @description handles shutdown behaviour, namely stop message receiving
   * and responds back to verify that message was handled
   * @param {{payload:string, id:number, timestamp:number}} message
   */
  handleShutdown(message) {
    this.state = 'SHUTDOWN'
    this.stopReceivingTopicMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  /**
   * @private
   * @description handles init behaviour, namely starts receiving messages, sets state to running
   * and responds back to verify that message was handled
   * @param {{payload:string, id:number, timestamp:number}} message
   */
  handleInit(message) {
    if (this.state === 'RUNNING') {
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = 'RUNNING'
    this.startReceivingTopicMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }
  
  /**
   * @private
   * @description handles my.o behaviour, sends a `Got message ${receivedMessage}` to my.i topic
   * @param {{payload:string, message:string}} message
   */
  handleMyo(message) {
    setTimeout(() => {
      const sendMessage = `Got message ${message.message}`
      this.queue.publishTopicMessage({message:sendMessage, topic:'my.i'})
    },waitUntilSendMessage)
  }

  /**
   * @description service starts receiving message again
   */
  startReceivingTopicMessages() {
    this.queue.startReceivingTopicMessages()
  }
  
  /**
   * @description service stops receiving messages
   */
  stopReceivingTopicMessages() {
    this.queue.stopReceivingTopicMessages()
  }
}