require('dotenv-defaults').config()
const pino = require('pino')
const fs = require('fs')
const rabbitMq = require('amqplib')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env
const {initExchangeConsumer} = require('@badgrhammer/rabbitmq-helpers')
const dataPath = '../data/output.txt'

const logger = pino({level: LOGLEVEL || 'error'})
const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 

async function start() {
  fs.unlink(dataPath,async(err) => {
    if (err && err.code !== 'ENOENT') {
      throw err
    }
    const {channel, queue} = await initExchangeConsumer({
      rabbitMq,
      connectionString,
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