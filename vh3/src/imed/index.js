require('dotenv').config()
const rabbitMq = require('amqplib')
const {initExchangeConsumer, initExchangeProducer} = require('../rabbitmq')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV} = process.env


async function start() {
  const producer = await initExchangeProducer({
    rabbitMq,
    serverUrl: ENV === 'docker' ? 'rabbit' : RABBIT_SERVER_URL,
    serverPort: RABBIT_SERVER_PORT,
    userName: RABBIT_USERNAME,
    password: RABBIT_PASSWORD,
    exchange: EXCHANGE
  })

  const {channel:consumer, queue} = await initExchangeConsumer({
    rabbitMq,
    serverUrl: ENV === 'docker' ? 'rabbit' : RABBIT_SERVER_URL,
    serverPort: RABBIT_SERVER_PORT,
    userName: RABBIT_USERNAME,
    password: RABBIT_PASSWORD,
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