require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const pino = require('pino')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, LOGLEVEL} = process.env

const logger = pino({level: LOGLEVEL || 'error'})
// TODO: Using docker as env is not consistent with docker setup, this needs to be made consistent
const serverUrl = ENV === 'docker' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'docker' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 
const {appendToFile, deleteFile} = require('./utils')

const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  TOPIC_EXCHANGE,
  FANOUT_EXCHANGE,
  CONNECTION_STRING:connectionString
}


class Obse {
  constructor() {
    this.initQueue()
    this.state = 'RUNNING'
    this.initListeners()
    this.startReceivingTopicMessages()
    // TODO: deleteFile()
  }

  async initQueue() {
    if (ENV === 'test') {
      this.queue = queueMock
    }
    else {
      this.queue = new Queue({rabbitConfig, topicProducer:true, topicConsumer:{topic:'my.#'}, fanoutConsumer:true})
    }
  }

  initListeners() {
    this.queue.on('message',(message) => {
      console.log('Obse got message', message)
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

  // eslint-disable-next-line class-methods-use-this
  handleMy(message) {
    console.log('Handling my', message)
    const logMessage = `${new Date().toISOString()} Topic ${message.payload}: ${message.message}`
    appendToFile(logMessage)
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
  }

  startReceivingTopicMessages() {
    console.log('Obse starting receiving messages')
    this.queue.startReceivingTopicMessages()
  }
  
  stopReceivingTopicMessages() {
    console.log('Obse stopping receiving messages')
    this.queue.stopReceivingTopicMessages()
  }

}

new Obse()


// async function start() {
//   await deleteFile()
//   const {channel, queue} = await initExchangeConsumer({
//     rabbitMq,
//     connectionString,
//     topic: 'my.#',
//     exchange: EXCHANGE      
//   })
//   channel.consume(queue, (message) => {
//     if (message !== null) {
//       channel.ack(message)
//       const logMessage = `${new Date().toISOString()} Topic ${message.fields.routingKey}: ${message.content.toString()}`
//       appendToFile(logMessage)
//     }
//   })
// }