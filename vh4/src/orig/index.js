require('dotenv-defaults').config()
const pino = require('pino')
const Queue = require('@badgrhammer/rabbitmq-helpers')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, LOGLEVEL} = process.env
const messageIntervalTime = 3000
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
  constructor() {
    
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