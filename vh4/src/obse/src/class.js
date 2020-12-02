require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const pino = require('pino')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, DOCKER, LOGLEVEL} = process.env

const logger = pino({level: LOGLEVEL || 'error'})
// TODO: Using docker as env is not consistent with docker setup, this needs to be made consistent
const serverUrl = DOCKER ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = DOCKER ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 
const fs = require('./utils')

const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  TOPIC_EXCHANGE,
  FANOUT_EXCHANGE,
  CONNECTION_STRING:connectionString
}

module.exports = class Obse {
  /**
   * @description class implementation of Obse service outlined in README
   */
  constructor() {
    this.init()
  }

  /**
   * @private
   * @description init function which handles deletion of old files, initializes queue and queue listeners and sets state
   * RUNNING
   */
  async init() {
    await fs.deleteFile()
    this.initQueue()
    this.initListeners()
    this.state = 'RUNNING'
  }
  
  /**
   * @private
   * @description initializes mock queue in test env and a real queue instance in production or dev
   */
  async initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, topicConsumer:{topic:'my.#'}, fanoutConsumer:true})
    }
  }

  /**
   * @private
   * @description add listeners to messages sent from the queue service
   */
  initListeners() {
    this.queue.on('message',(message) => {
      this.handleMessage(message)
    })
  }

  /**
   * @private
   * @description handles message routing based on payload
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
        this.handleMy(message)
        break
      case 'my.i':
        this.handleMy(message)
        break
      default:
        console.warn('Received message without handler', message)
        break
    }
  }

  /**
   * @private
   * @description handles shutdown behaviour, namely stops receiving messages, sets state to SHUTDOWN
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
   * @description handles init behaviour, namely starts receiving messages, sets state to RUNNING
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
   * @description handles my.o and my.i message behaviour, namely saves them.
   * @param {{payload:string, message:string}} message
   */
  // eslint-disable-next-line class-methods-use-this
  handleMy(message) {
    const logMessage = `${new Date().toISOString()} Topic ${message.payload}: ${message.message}`
    fs.appendToFile(logMessage)
  }
  
  /**
   * @description service starts receiving messages
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