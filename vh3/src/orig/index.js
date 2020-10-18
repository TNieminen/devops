require('dotenv').config()
const rabbitMq = require('amqplib')
const {initExchangeProducer} = require('../rabbitmq')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV} = process.env
const messageIntervalTime = 3000
const amountOfMessages = 3 

async function start() {
  const channel = await initExchangeProducer({
    rabbitMq,
    serverUrl: ENV === 'docker' ? 'rabbit' : RABBIT_SERVER_URL,
    serverPort: RABBIT_SERVER_PORT,
    userName: RABBIT_USERNAME,
    password: RABBIT_PASSWORD,
    exchange: EXCHANGE
  })
  let iterator = 0
  // the interval of a single item will be equal to the amount of items in seconds
  // for instance if amountOfMessage = 3, each message will be sent every three seconds
  const messageInterval = setInterval(() => {
    const message = `MSG_${iterator += 1}`
    // we don't need a queue on the publisher side since we are using an exchange with a topic strategy
    channel.publish(EXCHANGE,'my.o', Buffer.from(message))
    if (iterator === amountOfMessages) {
      clearInterval(messageInterval)
    }  
  },messageIntervalTime)
}

start()