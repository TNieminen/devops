require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, DOCKER, LOGLEVEL} = process.env
const defaultMessageIntervalTime = 3000
const amountOfMessages = 3 

const serverUrl = DOCKER ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = DOCKER ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 


const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  TOPIC_EXCHANGE,
  FANOUT_EXCHANGE,
  CONNECTION_STRING:connectionString
}

module.exports = class Orig {
  /**
   * @description Implements Orig class defined in README
   * @param {{messageIntervalTime:number}} config
   */
  constructor(config = {}) {
    this.state = 'RUNNING'
    this.messageInterval = {_destroyed:true}
    this.initQueue()
    this.initListeners()
    this.messageIntervalTime = config.messageIntervalTime || defaultMessageIntervalTime
    this.startSendingMessages()
  }

  /**
   * @private
   * @description initializes queue service. In test env we use mock and otherwise the real implementation
   */
  initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, fanoutConsumer:true})
    }
  }

  /**
   * @private
   * @description initializes listener to receive messages from queue
   */
  initListeners() {
    this.queue.on('message',(message) => {
      this.handleMessage(message)
    })
  }

  /**
   * @private
   * @description routes messages sent from the queue service based on payload
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
      case 'RUNNING':
        this.handleRunning(message)
        break
      case 'PAUSE':
        this.handlePause(message)
        break
      default:
        console.warn('Received message without handler', message)
        break
    }
  }

  /**
   * @private
   * @description handles shutdown behaviour, namely stops sending messages, sets state to SHUTDOWN
   * and responds back to verify that message was handled
   * @param {{payload:string, id:number, timestamp:number}} message
   */
  handleShutdown(message) {
    this.state = 'SHUTDOWN'
    this.stopSendingMessages()
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
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    this.startSendingMessages()
  }

  /**
   * @private
   * @description handles RUNNING behaviour, namely starts receiving messages if mode is not SHUTDOWN, sets state to RUNNING
   * and responds back to verify that message was handled
   * @param {{payload:string, id:number, timestamp:number}} message
   */
  handleRunning(message) {
    if (this.state === 'SHUTDOWN') {
      message.error = new Error('Cannot set to running when shutdown').toString()
      console.warn(message.error)
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = message.payload
    this.startSendingMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  /**
   * @private
   * @description handles PAUSE behaviour, namely stops receiving messages if mode is not SHUTDOWN, sets state to PAUSE
   * and responds back to verify that message was handled
   * @param {{payload:string, id:number, timestamp:number}} message
   */
  handlePause(message) {
    if (this.state === 'SHUTDOWN') {
      message.error = new Error('Cannot pause when shutdown').toString()
      console.warn(message.error)
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = message.payload
    this.stopSendingMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  /**
   * @description starts sending messages to topic my.o on in an interval defined by this.intervalTime 
   */
  startSendingMessages() {
    let iterator = 0
    // in node.js interval returns an object, not an id
    // eslint-disable-next-line no-underscore-dangle
    if (this.messageInterval._destroyed) {
      this.messageInterval = setInterval(() => {
        const message = `MSG_${iterator += 1}`
        this.queue.publishTopicMessage({message,topic:'my.o'})
        if (iterator === amountOfMessages) {
          clearInterval(this.messageInterval)
          this.startSendingMessages()
        }  
      },this.messageIntervalTime)
    }
  }

  /**
   * @description stops sending messages
   */
  stopSendingMessages() {
    clearInterval(this.messageInterval)
  }

}