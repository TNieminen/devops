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

module.exports = class Obse {
  constructor() {
    this.initQueue()
    this.initListeners()
    this.state = 'RUNNING'
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
    
  }

}

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

// start()