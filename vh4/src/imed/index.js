require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const pino = require('pino')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, LOGLEVEL} = process.env

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


class Imed {
  constructor() {
    this.initQueue()
    this.state = 'RUNNING'
    this.initListeners()
    this.startReceivingTopicMessages()
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

  handleMyo(message) {
    console.log('Handling myo', message)
    setTimeout(() => {
      const sendMessage = `Got message ${message.message}`
      this.queue.publishTopicMessage({message:sendMessage, topic:'my.i'})
    },1000)
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
    console.log('Imed starting receiving messages')
    this.queue.startReceivingTopicMessages()
  }
  
  stopReceivingTopicMessages() {
    console.log('Imed stopping receiving messages')
    this.queue.stopReceivingTopicMessages()
  }

}

new Imed()

// async function start() {
//   const producer = await initExchangeProducer({
//     rabbitMq,
//     connectionString,
//     exchange: EXCHANGE
//   })

//   const {channel:consumer, queue} = await initExchangeConsumer({
//     rabbitMq,
//     connectionString,
//     topic: 'my.o',
//     exchange: EXCHANGE
//   })
  
//   consumer.consume(queue, (message) => {
//     if (message !== null) {
//       setTimeout(() => {
//         const sendMessage = `Got message ${message.content.toString()}`
//         producer.publish(EXCHANGE,'my.i', Buffer.from(sendMessage))
//         consumer.ack(message)
//       },1000)
//     }
//   })
// }

// start()


