require('dotenv-defaults').config()
const Queue = require('@badgrhammer/rabbitmq-helpers')
const queueMock = require('@badgrhammer/rabbitmq-helpers/src/mock')
const {RABBIT_SERVER_URL, RABBIT_SERVER_PORT, RABBIT_USERNAME, RABBIT_PASSWORD, TOPIC_EXCHANGE, FANOUT_EXCHANGE, ENV, DOCKER, LOGLEVEL} = process.env
const heroku = require('heroku')

const serverUrl = DOCKER ? 'rabbit' : RABBIT_SERVER_URL
const serverPort = DOCKER ? `:${RABBIT_SERVER_PORT}` : ''
const connectionString = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${serverUrl}${serverPort}?heartbeat=5`

// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'RUNNING'
let state = defaultState
let log = ''

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
  queue = new Queue({rabbitConfig, topicConsumer:{topic:'control-response'}, topicProducer:true, fanoutProducer:true})
}


/**
 * @description sends control message to queue service with id
 * possible message types include INIT, SHUTDOWN, PAUSE and RUNNING
 */
async function sendMessage({timestamp, id, payload}) {
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



/**
 * @description in production environment scales HTTPSERV, ORIG, OBSE and IMED
 * to 1 instance. On development returns
 */
async function initService() {
  // on dev there is no need to actually scale containers
  // sending the INIT message will make the services act in INIT & RUNNING mode
  if (ENV !== 'production') {
    return
  }
  const promises = []
  promises.push(heroku.run(['ps:scale', 'web=1', '-a', 'devops-httpserv']))
  promises.push(heroku.run(['ps:scale', 'worker=1', '-a', 'devops-orig']))
  promises.push(heroku.run(['ps:scale', 'worker=1', '-a', 'devops-imed']))
  promises.push(heroku.run(['ps:scale', 'worker=1', '-a', 'devops-obse']))
  return Promise.all(promises)
}

/**
 * @description in production environment scales HTTPSERV, ORIG, OBSE and IMED
 * to 0 instances. On development returns
 */
async function stopService() {
  // on dev there is no need to actually scale containers
  // sending stop as a queue message will simulate startup equal to container start
  if (ENV !== 'production') {
    return
  }
  const promises = []
  promises.push(heroku.run(['ps:scale', 'web=0', '-a', 'devops-httpserv']))
  promises.push(heroku.run(['ps:scale', 'worker=0', '-a', 'devops-orig']))
  promises.push(heroku.run(['ps:scale', 'worker=0', '-a', 'devops-imed']))
  promises.push(heroku.run(['ps:scale', 'worker=0', '-a', 'devops-obse']))
  return Promise.all(promises)
}

/**
 * @description changes state of the HTTPSERV, IMED, OBSE and ORIG
 * possible message types include INIT, SHUTDOWN, PAUSE and RUNNING.
 * Waits for confirmation of receipt before resolving. Returns the originally sent message
 * back as confirmation.
 * @param {{timestamp:number, id:number, payload:string}}
 * @returns {Promise<{timestamp:number, id:number, payload:number}>} 
 */
async function changeState({timestamp, id, payload}) {
  // if the previous state equals to new state, we return early
  if (state === payload) {
    return {timestamp,payload}
  }
  await sendMessage({timestamp, id, payload})
  // We can't await a response to init because no-one will answer, it is important to run it before querying response
  if (payload === 'INIT') {
    await initService()
    state = 'RUNNING'
    log += `${new Date(timestamp).toISOString()} INIT\n`
    return {timestamp, payload}
  }
  const response = await queryResponse(id)
  if (payload === 'SHUTDOWN') {
    await stopService()
  }
  return response  
}

/**
 * @description queries response from state on an interval equal to pre-configured queryInterval.
 * Returned message is equal to originally sent message.
 * @returns {Promise<{timestamp:number, id:number, payload:number}>}
 */
function queryResponse(id) {
  return new Promise((resolve,reject) => {
    const queryInterval = setInterval(() => {
      try {
        const response = queue.getMessageById(id) 
        if (response) {
          clearInterval(queryInterval)
          if (response.payload === 'INIT') {
            state = 'RUNNING'
          }
          else {
            state = response.payload
          }
          // TODO: non SHUTDOWN and INIT messages do not contain valid timestamps
          // inserting it here will be off my some milliseconds however should be fixed
          const timestamp = response.timestamp || Date.now()
          log += `${new Date(timestamp).toISOString()} ${response.payload}\n`
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


/**
 * @description gets the current state
 * @returns {string}
 */
function getState() {
  return state
}

/**
 * @description sets the state into initial condition
 * @returns {string}
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
 * @returns {string}
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