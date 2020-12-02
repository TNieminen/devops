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
      this.queue = new Queue({rabbitConfig, topicProducer:true, topicConsumer:{topic:'control-request'}, fanoutConsumer:true})
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

// function sendMessages(channel) {
//   let iterator = 0
//   const messageInterval = setInterval(() => {
//     const message = `MSG_${iterator += 1}`
//     // we don't need a queue on the publisher side since we are using an exchange with a topic strategy
//     channel.publish(EXCHANGE,'my.o', Buffer.from(message))
//     if (iterator === amountOfMessages) {
//       clearInterval(messageInterval)
//       sendMessages(channel)
//     }  
//   },messageIntervalTime)
// }

// async function start() {
//   const channel = await initExchangeProducer({
//     rabbitMq,
//     connectionString,
//     exchange: EXCHANGE
//   })
//   setTimeout(() => {
//     sendMessages(channel)
//   }, setupTimeout)
// }

// start()