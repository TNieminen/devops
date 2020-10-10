require('dotenv').config()
const pino = require('pino')
const rabbitMQ = require('amqplib')
const logger = pino({level:'debug'})
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE} = process.env

const messages = ['MSG_1','MSG_2', 'MSG_3']

async function startProducer() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  // we don't need a queue on the publisher side since we are using an exchange with a topic strategy
  setInterval(() => {
    messages.forEach((message) => {
      channel.publish(EXCHANGE,'my.o', Buffer.from(message)) 
      channel.publish(EXCHANGE,'my.j', Buffer.from(message))  
    })
  },3000)

}

async function startConsumer1() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, EXCHANGE, 'my.o')
  channel.consume(q.queue, (message) => {
    if (message !== null) {
      channel.ack(message) // https://www.rabbitmq.com/confirms.html
      logger.info(`my.o message: ${message.content.toString()}`)
    }
  })
}

async function startConsumer2() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, EXCHANGE, 'my.j')
  channel.consume(q.queue, (message) => {
    if (message !== null) {
      channel.ack(message) // https://www.rabbitmq.com/confirms.html
      logger.info(`my.j message: ${message.content.toString()}`)
    }
  })
}

async function startObserver() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, EXCHANGE, 'my.#')
  channel.consume(q.queue, (message) => {
    if (message !== null) {
      channel.ack(message) // https://www.rabbitmq.com/confirms.html
      logger.info(`Observer message: ${message.content.toString()}`)
    }
  })
}


// NOTE: Since every consumer is creating their own queue, everyone will receive all the messages
// if consumers shared the queue, they would not get duplicate events
startProducer()
startConsumer1()
startConsumer2()
startObserver()