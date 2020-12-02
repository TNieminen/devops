const rabbitMq = require('amqplib')
const rabbit = require('./rabbit')
const {EventEmitter} = require('events')

/**
 * @typedef {Object} rabbitMqOptions
 * @property {string} CONNECTION_STRING
 * @property {string} EXCHANGE
 * 
 */

module.exports = class Queue {
  /**
   * @description Queue wrapper to handle topic and fanout rabbit consumers and producers
   * @param {{topicProducer:boolean, topicConsumer:{topic:string}, fanoutConsumer:boolean, fanoutProducer:boolean, rabbitConfig:rabbitMqOptions }} config
   */
  constructor({topicProducer, topicConsumer, fanoutProducer, fanoutConsumer, rabbitConfig}) {
    if (!rabbitConfig.CONNECTION_STRING) {
      throw new Error('Queue requires config key CONNECTION_STRING')
    }
    this.rabbitConfig = rabbitConfig
    if (topicProducer) {
      if (!this.rabbitConfig.TOPIC_EXCHANGE) {
        throw new Error('Queue requires config key TOPIC_EXCHANGE')
      }
      this.initTopicProducer()  
    }
    if (topicConsumer) {
      if (!topicConsumer.topic) {
        throw new Error('TopicConsumer requires a defined topic')
      }
      if (!this.rabbitConfig.TOPIC_EXCHANGE) {
        throw new Error('Queue requires config key TOPIC_EXCHANGE')
      }
      this.initTopicConsumer(topicConsumer) 
    }  
    if (fanoutProducer) {
      if (!this.rabbitConfig.FANOUT_EXCHANGE) {
        throw new Error('Queue requires config key FANOUT_EXCHANGE')
      }
      this.initFanoutProducer()
    }
    if (fanoutConsumer) {
      if (!this.rabbitConfig.FANOUT_EXCHANGE) {
        throw new Error('Queue requires config key FANOUT_EXCHANGE')
      }
      this.initFanoutConsumer()
    }
    this.isTopicProducerErrorState = true
    this.isTopicConsumerErrorState = true
    this.isFanoutProducerErrorState = true
    this.isFanoutConsumerErrorState = true
    this.receiveTopicMessages = true
    this.messages = {}
    this.emitter = new EventEmitter()
  }

  on(event,fn) {
    this.emitter.on(event,fn)
  }


  async initFanoutConsumer() {
    try {
      const {channel, queue} = await rabbit.initFanoutConsumer({
        rabbitMq,
        connectionString:this.rabbitConfig.CONNECTION_STRING,
        topic: '',
        exchange: this.rabbitConfig.FANOUT_EXCHANGE
      })
      this.fanoutConsumer = channel
      this.fanoutConsumer.consume(queue, (message) => {
        if (message !== null) {
          this.putMessage(message, 'fanout')
          // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
          // however for development simplicity we'll just save messages and acknowledge them immediately
          this.fanoutConsumer.ack(message)
        }
      })
      this.isFanoutConsumerErrorState = false
      this.fanoutConsumer.on('close',(err) => {
        console.warn('Queue TopicConsumer:', err)
        this.isFanoutConsumerErrorState = true
        this.initFanoutConsumer()
      })
    }
    catch (err) {
      console.warn('Queue FanoutConsumer:', err)
      this.isFanoutConsumerErrorState = true
      setTimeout(() => this.initFanoutConsumer(),1000)
    }
  }

  async initFanoutProducer() {
    try {
      this.fanoutProducer = await rabbit.initFanoutProducer({
        rabbitMq,
        connectionString:this.rabbitConfig.CONNECTION_STRING,
        exchange: this.rabbitConfig.FANOUT_EXCHANGE
      })
      this.isFanoutProducerErrorState = false
      this.fanoutProducer.on('close',(err) => {
        console.warn('Queue FanoutProducer:', err)
        this.isFanoutProducerErrorState = true
        this.initFanoutProducer()
      })
    }
    catch (err) {
      console.warn('Queue FanoutProducer:', err)
      this.isFanoutProducerErrorState = true
      setTimeout(() => this.initFanoutProducer(),1000)
    }
  }

  async initTopicProducer() {
    try {
      this.topicProducer = await rabbit.initTopicProducer({
        rabbitMq,
        connectionString:this.rabbitConfig.CONNECTION_STRING,
        exchange: this.rabbitConfig.TOPIC_EXCHANGE
      })
      this.isTopicProducerErrorState = false
      this.topicProducer.on('close',(err) => {
        console.warn('Queue TopicProducer:', err)
        this.isTopicProducerErrorState = true
        this.initTopicProducer()
      })
    }
    catch (err) {
      console.warn('Queue TopicProducer:', err)
      this.isTopicProducerErrorState = true
      setTimeout(() => this.initTopicProducer(),1000)
    }
  }

  async initTopicConsumer(config) { 
    try {
      const {channel, queue} = await rabbit.initTopicConsumer({
        rabbitMq,
        connectionString:this.rabbitConfig.CONNECTION_STRING,
        topic: config.topic,
        exchange: this.rabbitConfig.TOPIC_EXCHANGE
      })
      this.topicConsumer = channel
      this.topicConsumer.consume(queue, (message) => {
        if (message !== null && this.receiveTopicMessages) {
          this.putMessage(message, 'topic')
          // it would be better to acknowledge messages only when they are actually sent as a response in case apigateway goes down
          // however for development simplicity we'll just save messages and acknowledge them immediately
          this.topicConsumer.ack(message)
        }
      })
      this.isTopicConsumerErrorState = false
      this.topicConsumer.on('close',(err) => {
        console.warn('Queue TopicConsumer:', err)
        this.isTopicConsumerErrorState = true
        this.initTopicConsumer()
      })
    }
    catch (err) {
      console.warn('Queue TopicConsumer:', err)
      this.isTopicConsumerErrorState = true
      setTimeout(() => this.initTopicConsumer(),1000)
    }
  }

  /**
   * @private
   * @description amqplib does not handle reconnections well and
   * it is likely that if rabbitmq hasn't been running we willl experience
   * ECONNRESET or Socket closed abruptly during opening handshake errors.
   * In order to prevent messages from being lost, we can wait in a loop until
   * the problem resolves. This can effectively be an infinite loop, so a more elegant
   * solution would be to either time the Docker setup or alternatively maybe just enforce
   * absolute amount of tries before failing the request
   */
  waitForTopicProducerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isTopicProducerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  /**
   * @private
   * @description amqplib does not handle reconnections well and
   * it is likely that if rabbitmq hasn't been running we willl experience
   * ECONNRESET or Socket closed abruptly during opening handshake errors.
   * In order to prevent messages from being lost, we can wait in a loop until
   * the problem resolves. This can effectively be an infinite loop, so a more elegant
   * solution would be to either time the Docker setup or alternatively maybe just enforce
   * absolute amount of tries before failing the request
   */
  waitForFanoutProducerResolved() {
    return new Promise((resolve,reject) => {
      setInterval(() => {
        if (!this.isFanoutProducerErrorState) {
          resolve()
        }
      },1000)
    })
  }

  /**
   * @description send a message to topic in predefined exchange
   */
  async publishTopicMessage({message = '', topic = ''}) {
    if (!message) {
      throw new Error('Cannot publish topic message without message')
    }
    if (!topic) {
      throw new Error('Cannot publish topic message without topic')
    }
    if (this.isTopicProducerErrorState) {
      await this.waitForTopicProducerResolved()
    }
    console.log(`SENDING MESSAGE ${message} with topic ${topic}`)
    return this.topicProducer.publish(this.rabbitConfig.TOPIC_EXCHANGE, topic, Buffer.from(message))  
  }

  async publishFanoutMessage({message}) {
    if (!message) {
      throw new Error('Cannot publish fanout message without message')
    }
    if (this.isFanoutProducerErrorState) {
      await this.waitForFanoutProducerResolved()
    }
    // we don't define a topic on fanout mode
    return this.fanoutProducer.publish(this.rabbitConfig.FANOUT_EXCHANGE,'', Buffer.from(message))  
  }


  /**
  * @private
  * @description saves a message to local state
  * @param {{content:'{id, payload, timestamp}'}} msg
  */
  putMessage(msg, type) {
    if (type === 'fanout') {
      const message = JSON.parse(msg.content)
      const {id} = message
      this.messages[`${id}`] = message
      console.log('Putting and Emitting message fanout control', message)
      this.emitter.emit('message', message)
    }
    else {
      const message = msg.content.toString()
      const payload = msg.fields.routingKey
      this.emitter.emit('message', {payload, message})
    }

    return this.messages
  }

  /**
  * @public
  * @description gets a message from local state by message id
  */
  getMessageById(id) {
    return this.messages[`${id}`]
  }

  /**
   * @public
   * @description remove all received messages
   */
  clearMessages() {
    Object.keys(this.messages).forEach(key => delete this.messages[`${key}`])
    return this.messages
  }

  /**
   * @description stops receiving topic based messages
   */
  stopReceivingTopicMessages() {
    this.receiveTopicMessages = false
  }

  /**
   * @description starts receiving topic based messages
   */
  startReceivingTopicMessages() {
    this.receiveTopicMessages = true
  }

}