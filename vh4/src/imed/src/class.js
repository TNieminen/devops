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
  constructor() {
    this.state = 'RUNNING'    
    this.initQueue()
    this.initListeners()
  }
  
  initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, topicConsumer:{topic:'my.o'}, fanoutConsumer:true})
    }
  }

  initListeners() {
    this.queue.on('message',(message) => {
      console.log('Imed got message', message)
      this.handleMessage(message)
    })
  }

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

  handleShutdown(message) {
    this.state = 'SHUTDOWN'
    this.stopReceivingTopicMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  handleInit(message) {
    if (this.state === 'RUNNING') {
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = 'RUNNING'
    console.log('Setting service to running at INIT')
    this.startReceivingTopicMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }
  
  handleMyo(message) {
    console.log('Handling myo', message)
    setTimeout(() => {
      const sendMessage = `Got message ${message.message}`
      this.queue.publishTopicMessage({message:sendMessage, topic:'my.i'})
    },waitUntilSendMessage)
  }

  startReceivingTopicMessages() {
    console.log('Imed started receiving messages')
    this.queue.startReceivingTopicMessages()
  }
  
  stopReceivingTopicMessages() {
    console.log('Imed stopped receiving messages')
    this.queue.stopReceivingTopicMessages()
  }
}