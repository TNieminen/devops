require('dotenv-defaults').config()
const rabbitMq = require('amqplib')
const pino = require('pino')
const {initExchangeProducer} = require('@badgrhammer/rabbitmq-helpers')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env
const messageIntervalTime = 3000
const amountOfMessages = 3 
const setupTimeout = 5000


const logger = pino({level: LOGLEVEL || 'error'})
const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 

console.log('ENV', ENV)
console.log('Connectionstring ORIG', connectionString)
async function start() {
  const channel = await initExchangeProducer({
    rabbitMq,
    connectionString,
    exchange: EXCHANGE
  })
  let iterator = 0
  setTimeout(() => {
    const messageInterval = setInterval(() => {
      const message = `MSG_${iterator += 1}`
      // we don't need a queue on the publisher side since we are using an exchange with a topic strategy
      channel.publish(EXCHANGE,'my.o', Buffer.from(message))
      if (iterator === amountOfMessages) {
        clearInterval(messageInterval)
      }  
    },messageIntervalTime)
  }, setupTimeout)
}

start()