require('dotenv-defaults').config()
const rabbitMq = require('amqplib')
const pino = require('pino')
const {initExchangeConsumer, initExchangeProducer} = require('@badgrhammer/rabbitmq-helpers')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env

const logger = pino({level: LOGLEVEL || 'error'})
const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 


async function start() {
  const producer = await initExchangeProducer({
    rabbitMq,
    connectionString,
    exchange: EXCHANGE
  })

  const {channel:consumer, queue} = await initExchangeConsumer({
    rabbitMq,
    connectionString,
    topic: 'my.o',
    exchange: EXCHANGE
  })
  
  consumer.consume(queue, (message) => {
    if (message !== null) {
      setTimeout(() => {
        const sendMessage = `Got message ${message.content.toString()}`
        producer.publish(EXCHANGE,'my.i', Buffer.from(sendMessage))
        consumer.ack(message)
      },1000)
    }
  })
}

start()