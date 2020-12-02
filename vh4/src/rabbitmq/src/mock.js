const {EventEmitter} = require('events')

module.exports = {
  receiveTopicMessages:true,
  messages:{},
  emitter: new EventEmitter(),
  publishTopicMessage({message, topic}) {
    if (!message) {
      throw new Error('Cannot publish topic message without message')
    }
    if (!topic) {
      throw new Error('Cannot publish topic message without topic')
    }
  },
  publishFanoutMessage({message}) {
    if (!message) {
      throw new Error('Cannot publish fanout message without message')
    }
  },
  /**
   * @description simulates emits and storing of relevant data to messages 
   * on a fanout event
   */
  mockReceivedFanoutMessage({id, payload, timestamp}) {
    this.messages[id] = {payload,timestamp}
    this.emitter.emit('message', {id,payload,timestamp})
  },

  /**
   * @description simulated emits on topic messages
   */
  mockReceivedTopicMessage({payload, timestamp}) {
    if (this.receiveTopicMessages) {
      this.emitter.emit('message', {payload,timestamp}) 
    }
  },
  getMessageById(id) {
    return this.messages[id]
  },
  on(event,fn) {
    this.emitter.on(event,fn)
  },
  startReceivingTopicMessages() {
    this.receiveTopicMessages = true
  },
  stopReceivingTopicMessages() {
    this.receiveTopicMessages = false
  }
}