async function createRabbitConnection({rabbitMq, userName = '', password = '', serverUrl = '', serverPort = 0, exchange = ''}) {
  const connection = await rabbitMq.connect(`amqp://${userName}:${password}@${serverUrl}:${serverPort}`)
  const channel = await connection.createChannel()
  await channel.assertExchange(exchange, 'topic', {
    durable: false
  })
  return channel
}

exports.initExchangeProducer = async({rabbitMq, userName = '', password = '', serverUrl = '', serverPort = 0, exchange = ''}) => {
  return createRabbitConnection({rabbitMq, userName, password, serverUrl, serverPort, exchange})
}

exports.initExchangeConsumer = async({rabbitMq, userName = '', password = '', serverUrl = '', serverPort = 0, exchange = '', topic = ''}) => {
  const channel = await createRabbitConnection({rabbitMq, userName, password, serverUrl, serverPort, exchange})
  // empty string so we can assign a random queue automatically
  const q = await channel.assertQueue('', {exclusive: true})
  channel.bindQueue(q.queue, exchange, topic)
  return {channel, queue:q.queue}
}
