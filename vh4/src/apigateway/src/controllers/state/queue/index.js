require('dotenv-defaults').config()
const rabbitMq = require('amqplib')
const {initExchangeConsumer, initExchangeProducer} = require('@badgrhammer/rabbitmq-helpers')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env

const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}` 


const producer = initExchangeProducer({
  rabbitMq,
  connectionString,
  exchange: EXCHANGE
})

const {channel:consumer, queue} = initExchangeConsumer({
  rabbitMq,
  connectionString,
  topic: 'my.control-response',
  exchange: EXCHANGE
})

consumer.consume(queue, (message) => {
  if (message !== null) {
    putMessage(message)
    // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
    // however for development simplicity we'll just save messages and acknowledge them immediately
    consumer.ack(message)
  }
})

/**
 * @description a local store for received messages
 */
const messages = {}

/**
 * @description saves a message to local state
 */
function putMessage(msg) {
  const message = JSON.parse(msg.content)
  const {id, payload} = message
  messages[`${id}`] = payload
  return messages
}

/**
 * @description gets a message from local state by message id
 */
function getMessageById(id) {
  return messages[`${id}`]
}

/**
 * @description sends control message to queue service with id
 */
async function sendMessage(message) {
  await producer // producer init is a promise, awaiting it returns the same object after first init
  return producer.publish(EXCHANGE,'my.control-request', Buffer.from(message))
}


module.exports = {
  putMessage,
  getMessageById,
  sendMessage,
  messages
}