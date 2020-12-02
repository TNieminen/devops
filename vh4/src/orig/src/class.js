require('dotenv-defaults').config()
const pino = require('pino')
const Queue = require('@badgrhammer/rabbitmq-helpers')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, LOGLEVEL} = process.env
const defaultMessageIntervalTime = 3000
const amountOfMessages = 3 


const logger = pino({level: LOGLEVEL || 'error'})
const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
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
   * @param {{messageIntervalTime:number}} config
   */
  constructor(config = {}) {
    this.state = 'RUNNING'
    this.initQueue()
    this.initListeners()
    this.messageIntervalTime = config.messageIntervalTime || defaultMessageIntervalTime
    this.startSendingMessages()
  }

  initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, fanoutConsumer:true})
    }
  }

  initListeners() {
    this.queue.on('message',(message) => {
      this.handleMessage(message)
      this.startSendingMessages()
    })
  }

  handleMessage(message) {
    const {payload} = message
    console.log('HANDLE MSSAGE', message)
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

  handleShutdown(message) {
    this.state = 'SHUTDOWN'
    this.stopSendingMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  handleInit(message) {
    if (this.state === 'RUNNING') {
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = 'RUNNING'
    console.log('Setting service to running at INIT')
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    this.startSendingMessages()
  }

  handleRunning(message) {
    if (this.state === 'SHUTDOWN') {
      message.error = new Error('Cannot set to running when shutdown').toString()
      console.warn(message.error)
    }
    this.state = message.payload
    console.log('Setting service state to', this.state)
    this.startSendingMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  handlePause(message) {
    if (this.state === 'SHUTDOWN') {
      message.error = new Error('Cannot pause when shutdown').toString()
      console.warn(message.error)
      return this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
    }
    this.state = message.payload
    console.log('Setting service state to', this.state)
    this.stopSendingMessages()
    this.queue.publishTopicMessage({message:JSON.stringify(message), topic:'control-response'})
  }

  startSendingMessages() {
    let iterator = 0
    if (!this.messageInterval) {
      this.messageInterval = setInterval(() => {
        const message = `MSG_${iterator += 1}`
        this.queue.publishTopicMessage({message,topic:'my.o'})
        if (iterator === amountOfMessages) {
          clearInterval(this.messageInterval)
          this.messageInterval = undefined
          this.startSendingMessages()
        }  
      },this.messageIntervalTime)
    }
  }

  stopSendingMessages() {
    clearInterval(this.messageInterval)
    this.messageInterval = undefined
  }

}