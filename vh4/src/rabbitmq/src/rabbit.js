/**
 * @typedef {import('amqplib').Channel} Channel
 */

/**
 * @description creates a connection to rabbitMQ
 * @returns {Promise<Channel>}
 */
async function createRabbitConnection({rabbitMq, connectionString = '', exchange = '', type = 'topic'}) {
  const connection = await rabbitMq.connect(connectionString)
  const channel = await connection.createChannel()
  await channel.assertExchange(exchange, type, {
    durable: false
  })
  return channel
}

/**
 * @description Creates a producer instance of rabbitMQ in a given exchange
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
const initTopicProducer = async({rabbitMq, connectionString = '', exchange = ''}) => {
  return createRabbitConnection({rabbitMq, connectionString, exchange, type:'topic'})
}

/**
 * @description creates a consumer instance that binds a automatically created queue in a given exchange with a given topic.
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
const initTopicConsumer = async({rabbitMq, connectionString = '', exchange = '', topic = ''}) => {
  const channel = await createRabbitConnection({rabbitMq, connectionString, exchange, type:'topic'})
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, exchange, topic)
  return {channel, queue:q.queue}
}

/**
 * @description Creates a producer instance of rabbitMQ in a given exchange
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
const initFanoutProducer = async({rabbitMq, connectionString = '', exchange = ''}) => {
  return createRabbitConnection({rabbitMq, connectionString, exchange, type:'fanout'})
}

/**
 * @description creates a consumer instance that binds a automatically created queue in a given exchange with a given topic.
 * Syntax for connectionString: `amqp://${userName}:${password}@${serverUrl}:${serverPort}`.
 * In some services serverPort is not needed.
 */
const initFanoutConsumer = async({rabbitMq, connectionString = '', exchange = ''}) => {
  const channel = await createRabbitConnection({rabbitMq, connectionString, exchange, type:'fanout'})
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  // we leave the last option of topic empty so we can broadcast to all queues
  channel.bindQueue(q.queue, exchange, '')
  return {channel, queue:q.queue}
}


module.exports = {
  initTopicProducer,
  initTopicConsumer,
  initFanoutProducer,
  initFanoutConsumer
}