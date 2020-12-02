const {EventEmitter} = require('events')

module.exports = {
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
  mockReceivedFanoutMessage({message}) {
    const {id, payload, timestamp} = JSON.parse(message)
    this.messages[id] = {payload,timestamp}
    this.emitter.emit('message', {id,payload,timestamp})
  },
  mockReceivedTopicMessage({}) {
    this.emitter.emit('message', {payload,timestamp})
  },
  getMessageById(id) {
    return this.messages[id]
  },
  on(event,fn) {
    this.emitter.on(event,fn)
  }

} 