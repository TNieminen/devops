/**
 * @typedef {import('amqplib').Channel} Channel
 */

/**
 * @returns {Promise<Channel>}
 */
async function createRabbitConnection({rabbitMq, connectionString = '', exchange = ''}) {
  const connection = await rabbitMq.connect(connectionString)
  const channel = await connection.createChannel()
  await channel.assertExchange(exchange, 'topic', {
    durable: false
  })
  return channel
}

/**
 * @description Creates a producer instance of rabbitMQ in a given exchange
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
exports.initExchangeProducer = async({rabbitMq, connectionString = '', exchange = ''}) => {
  return createRabbitConnection({rabbitMq, connectionString, exchange})
}

/**
 * @description creates a consumer instance that binds a automatically created queue in a given exchange with a given topic.
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
exports.initExchangeConsumer = async({rabbitMq, connectionString = '', exchange = '', topic = ''}) => {
  const channel = await createRabbitConnection({rabbitMq, connectionString, exchange})
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, exchange, topic)
  return {channel, queue:q.queue}
}
