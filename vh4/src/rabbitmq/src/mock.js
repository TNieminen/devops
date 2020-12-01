const {EventEmitter} = require('events')

module.exports = {
  messages:{},
  emitter: new EventEmitter(),
  publishTopicMessage({message}) {
    // in reality storing of this message would happen from 
    // a response from an external service, for mocking purposes store original message
    const {id, payload, timestamp} = JSON.parse(message)
    this.messages[id] = {payload,timestamp}
    this.emitter.emit('message', {id,payload,timestamp})
  },
  publishFanoutMessage({message}) {
    // in reality storing of this message would happen from 
    // a response from an external service, for mocking purposes store original message
    const {id, payload, timestamp} = JSON.parse(message)
    this.messages[id] = {payload,timestamp}
    this.emitter.emit('message', {id,payload,timestamp})
  },
  getMessageById(id) {
    return this.messages[id]
  },
  on(event,fn) {
    this.emitter.on(event,fn)
  }
  
}