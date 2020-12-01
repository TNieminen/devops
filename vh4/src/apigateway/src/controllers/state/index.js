require('dotenv-defaults').config()
const  Queue = require('@badgrhammer/rabbitmq-helpers')
const {parse} = require('dotenv-defaults')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, EXCHANGE, ENV, LOGLEVEL} = process.env

const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}?heartbeat=5`
    
const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  EXCHANGE,
  CONNECTION_STRING:connectionString
}

let queue
// Not an elegant way to mock queue, but I couldn't find a good way to sinon mock a class constructor
// TODO: mock class constructor or find another solution that does not pollute production code
if (ENV === 'test') {
  queue = {
    messages:{},
    publishTopicMessage({message}) {
      // in reality storing of this message would happen from 
      // a response from an external service, for mocking purposes store original message
      const {id, payload, timestamp} = JSON.parse(message)
      this.messages[id] = {payload,timestamp}
    },
    publishFanoutMessage({message}) {
      // in reality storing of this message would happen from 
      // a response from an external service, for mocking purposes store original message
      const {id, payload, timestamp} = JSON.parse(message)
      this.messages[id] = {payload,timestamp}
    },
    getMessageById(id) {
      return this.messages[id]
    }
  }
}
else {
  queue = new Queue({rabbitConfig, topicConsumer:{topic:'control-response'}, topicProducer:true, fanoutConsumer:true, fanoutProducer:true})
}


/**
 * @description sends control message to queue service with id
 * - if type is set to fanout messages are delivered to all services
 * - if type is set to topic, only services subscribed to that topic receive the message
 */
async function sendMessage({timestamp, id, payload, type}) {
  if (!id) {
    throw new Error('Queue message has to have and id')
  }
  if (!payload) {
    throw new Error('Cannot send message without payload')
  }
  if (!timestamp || !Number.isInteger(timestamp)) {
    throw new Error('Cannot send message without valid timestamp')
  }
  if (type !== 'fanout' && type !== 'topic') {
    throw new Error('Message type needs to either topic or fanout')
  }
  const message = JSON.stringify({id, payload, timestamp})
  if (type === 'topic') {
    const topic = 'my.control-request'
    return queue.publishTopicMessage({message, topic})
  }
  return queue.publishFanoutMessage({message})  
  
}


// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'SHUTDOWN'
let state = defaultState
let log = ''


async function initService() {
  // on dev there is no need to actually scale containers
  // sending the INIT message will make the services act in INIT & RUNNING mode
  if (ENV !== 'production') {
    return
  }
  
}

async function stopService() {
  // on dev there is no need to actually scale containers
  // sending stop as a queue message will simulate startup equal to container start
  if (ENV !== 'production') {
    return
  }
}

/**
 * @description sends a pause control command to the queue and awaits for the response
 */
async function changeState({timestamp, id, payload}) {
  // console.log('Sending message', {timestamp, id, payload})
  // if the previous state equals to new state, we return early
  if (state === payload) {
    return {timestamp,payload}
  }
  let type
  if (payload === 'SHUTDOWN' || payload === 'INIT') {
    // Shutdown and init messages are sent to all services
    type = 'fanout'
  }
  else {
    // Other messages are send in the topic queue and received only by orig
    type = 'topic'
  }
  await sendMessage({timestamp, id, payload, type})
  const response = await queryResponse(id)
  if (payload === 'INIT') {
    await initService()
  }
  if (payload === 'SHUTDOWN') {
    await stopService()
  }
  return response  
}

/**
 * @description queries response from state on an interval
 */
function queryResponse(id) {
  return new Promise((resolve,reject) => {
    const queryInterval = setInterval(() => {
      // console.log('Querying response to', id)
      try {
        const response = queue.getMessageById(id) 
        if (response) {
          clearInterval(queryInterval)
          state = response.payload
          log += `${new Date(response.timestamp).toISOString()} ${response.payload}\n`
          resolve(response)
        }
      }
      catch (err) {
        clearInterval(queryInterval)
        reject(err)
      }
    },queryIntervalTime)
  }) 
}


function getState() {
  return state
}

/**
 * @description sets the state into initial condition
 */
function clearState() {
  state = defaultState
  return state
}

/**
 * @description clears local log
 */
function clearLog() {
  log = ''
}

/**
 * @description returns log string
 */
function getLog() {
  return log
}

module.exports = {
  changeState,
  getState,
  clearState,
  clearLog,
  getLog,
  sendMessage,
  queryResponse
}