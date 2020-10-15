require('dotenv').config()
const pino = require('pino')
const rabbitMQ = require('amqplib')
const logger = pino({level:'debug'})
const fs = require('fs')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE} = process.env

async function startObserver() {
  logger.info('Obse starting!')
  fs.unlink('../data/output.txt',async(err) => {
    if (err && err.code !== 'ENOENT') {
      throw err
    }
    const connection = await rabbitMQ.connect(`amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@rabbit:${RABBIT_SERVER_PORT}`)
    const channel = await connection.createChannel()
    await channel.assertExchange(EXCHANGE, 'topic', {
      durable: false
    })
    logger.info('Obse asserting queue!')
    // empty string so we can assign a random queue automatically
    const q = await channel.assertQueue('', {exclusive: true})
    channel.bindQueue(q.queue, EXCHANGE, 'my.#')
    channel.consume(q.queue, (message) => {
      logger.info('Obse got message!!')
      if (message !== null) {
        channel.ack(message) // https://www.rabbitmq.com/confirms.html
        const logMessage = `${new Date().toISOString()} Topic ${message.fields.routingKey}: ${message.content.toString()}`
        console.warn(__dirname)
        fs.appendFile('../data/output.txt',`${logMessage}\n`,(error) => {
          console.error(error)
        })
        logger.info(`OBSE: ${logMessage}`)
      }
    })
  })
}

startObserver()