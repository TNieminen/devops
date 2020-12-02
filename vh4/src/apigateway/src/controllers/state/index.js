require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, LOGLEVEL} = process.env

const serverUrl = ENV === 'development' ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = ENV === 'development' ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}?heartbeat=5`
    
const rabbitConfig = {
  RABBIT_SERVER_URL, 
  RABBIT_SERVER_PORT,
  RABBIT_USERNAME,
  RABBIT_PASSWORD, 
  TOPIC_EXCHANGE,
  FANOUT_EXCHANGE,
  CONNECTION_STRING:connectionString
}

let queue
// Not an elegant way to mock queue, but I couldn't find a good way to sinon mock a class constructor
// TODO: mock class constructor or find another solution that does not pollute production code
if (ENV === 'test') {
  queue = queueMock
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
  const message = JSON.stringify({id, payload, timestamp})
  return queue.publishFanoutMessage({message})  
  
}


// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'RUNNING'
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
  await sendMessage({timestamp, id, payload})
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
          console.log('Received response', response)
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