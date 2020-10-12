/**
 * @description related API documentation
 * @see http://www.squaremobius.net/amqp.node/channel_api.html
 */


/**
 * @description Creates a producer instance of rabbitMQ
 */
const createRabbitProducer = async({rabbitMQ = {}, serverUrl = '', serverPort = 0, queue = '', username = '', password = ''}) => {
  // amqp://username:password@address:port
  console.warn(`amqp://${username}:${password}@${serverUrl}:${serverPort}`)
  const connection = await rabbitMQ.connect(`amqp://${username}:${password}@${serverUrl}:${serverPort}`)
  const channel = await connection.createChannel()
  const options = {
    durable:true // the queue will survive broker restarts, modulo the effects of exclusive and autoDelete;
  }
  const ok = await channel.assertQueue(queue, options)
  if (ok.queue !== queue) {
    throw new Error(`RabbitMQ initialization failed, returned queue from connection ${ok.queue} doest not match given: ${queue}`)
  }
  channel.assertExchange('default-exchange', 'fanout', {durable: false})
  return channel
}

/**
 * @description Creates a producer instance of rabbitMQ
 */
const createRabbitConsumer = async({rabbitMQ = {}, serverUrl = '', serverPort = 0, queue = '', username = '', password = '', messageCallback = () => {}}) => {
  const rabbitInstance = await createRabbitProducer({rabbitMQ, serverUrl, serverPort, queue, username, password})
  rabbitInstance.consume(queue,((message) => {
    if (message !== null) {
      rabbitInstance.ack(message) // https://www.rabbitmq.com/confirms.html
      messageCallback(null, message.content.toString())
    }
  }))
}

/**
 * @description Send a single message with the content given as a buffer to the specific queue named, bypassing routing.
 */
const sendMessage = ({channel = {}, queue = '', message = ''}) => {
  const options = {
    persistent:true // The message will survive broker restarts provided it’s in a queue that also survives restarts.
  }
  channel.sendToQueue(queue,Buffer.from(message),options)
}

/**
 * @description Send a single message with the content given as a buffer to the specific queue named, bypassing routing.
 */
const publishMessage = ({channel = {}, exchange = 'default-exchange', message = ''}) => {
  const options = {
    persistent:true // The message will survive broker restarts provided it’s in a queue that also survives restarts.
  }
  channel.publish(exchange,,Buffer.from(message),options)
}


module.exports = {
  createRabbitProducer,
  createRabbitConsumer,
  sendMessage
}