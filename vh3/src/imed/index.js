require('dotenv').config()
const pino = require('pino')
const rabbitMQ = require('amqplib')
const logger = pino({level:'debug'})
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE} = process.env

async function initProducer() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  return channel
}

async function initConsumer() {
  const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_SERVER_URL}:${RABBIT_SERVER_PORT}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(EXCHANGE, 'topic', {
    durable: false
  })
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, EXCHANGE, 'my.o')
  return {channel, queue:q.queue}
}

class Imed {

  constructor() {
    this.init()
  }
  
  async init() {
    const {channel, queue} = await initConsumer()
    this.consumer = channel
    this.consumerQueue = queue
    this.producer = await initProducer()
    this.consumer.consume(this.consumerQueue, (message) => {
      if (message !== null) {
        setTimeout(() => {
          const sendMessage = `Got message ${message.content.toString()}`
          this.producer.publish(EXCHANGE,'my.i', Buffer.from(sendMessage))
          this.consumer.ack(message) // https://www.rabbitmq.com/confirms.html
          logger.debug(`IMED ${sendMessage}, emitting to my.i`)  
        },1000)
      }
    })
  }
}

exports.imed = new Imed()