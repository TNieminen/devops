const {EventEmitter} = require('events')

module.exports = {
  messages:{},
  emitter: new EventEmitter(),
  publishTopicMessage({message}) {
    const {payload, timestamp} = JSON.parse(message)
  },
  publishFanoutMessage({message}) {
    const {id, payload, timestamp} = JSON.parse(message)
    this.messages[id] = {payload,timestamp}
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