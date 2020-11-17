require('dotenv-defaults').config()
const pino = require('pino')
const logger = pino({level:'debug'})
const fs = require('fs')
const rabbitMq = require('amqplib')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV} = process.env
const {initExchangeConsumer} = require('../rabbitmq/')
const dataPath = '../data/output.txt'

async function start() {
  fs.unlink(dataPath,async(err) => {
    if (err && err.code !== 'ENOENT') {
      throw err
    }
    const {channel, queue} = await initExchangeConsumer({
      rabbitMq,
      serverUrl: ENV === 'docker' ? 'rabbit' : RABBIT_SERVER_URL,
      serverPort: RABBIT_SERVER_PORT,
      userName: RABBIT_USERNAME,
      password: RABBIT_PASSWORD,
      topic: 'my.#',
      exchange: EXCHANGE
    })
    channel.consume(queue, (message) => {
      if (message !== null) {
        channel.ack(message)
        const logMessage = `${new Date().toISOString()} Topic ${message.fields.routingKey}: ${message.content.toString()}`
        fs.appendFile(dataPath,`${logMessage}\n`,(error) => {
          if (err)logger.error(error)
        })
      }
    })
  })
}

start()