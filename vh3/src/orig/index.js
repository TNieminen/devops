require('dotenv').config()
const pino = require('pino')
const rabbitMQ = require('amqplib')
const logger = pino({level:'debug'})

// Dev modules
require('../imed')
require('../obse')
require('../httpserv/src/bin/www')
//

const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE} = process.env

async function startORIG() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  let iterator = 0
  // we don't need a queue on the publisher side since we are using an exchange with a topic strategy
  setInterval(() => {
    const message = `MSG_${iterator += 1}`
    channel.publish(EXCHANGE,'my.o', Buffer.from(message))
    if (iterator === 3) {
      iterator = 0
    }  
  },3000)
}






// NOTE: Since every consumer is creating their own queue, everyone will receive all the messages
// if consumers shared the queue, they would not get duplicate events
startORIG()