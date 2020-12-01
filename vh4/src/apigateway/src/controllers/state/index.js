const {ENV} = process.env
const queue = require('./queue')

// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'SHUTDOWN'
let state = defaultState
let log = ''


function initService() {
  
}

function stopService() {
  
}

/**
 * @description sends a pause control command to the queue and awaits for the response
 */
async function changeState({timestamp, id, payload}) {
  console.log('Sending message', {timestamp, id, payload})
  // if the previous state equals to new state, we return early
  if (!state === payload) {
    return {timestamp,payload}
  }
  await queue.sendMessage({timestamp, id, payload})
  const response = await queryResponse(id)
  /**
   * In dev mode there is no easy way to scale other containers down
   * because apigateway is running in it's own docker environment
   * hence in dev mode we simulate init and shutdown behaviour via message service. 
   * This will also happen in production, but in addition to this we actually scale the services down or up.
   * Added benefit to this is that we can have a controlled shutdown behaviour which should prevent
   * potential data loss.
   */
  if (payload === 'INIT' && ENV === 'production') {
    await initService()
  }
  if (payload === 'SHUTDOWN' && ENV === 'production') {
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
      console.log('Querying response to', id)
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
  getLog
}