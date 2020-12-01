const {ENV} = process.env
const queue = require('./queue')

// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'SHUTDOWN'
let state = defaultState
let log = ''

/**
 * @description sends a pause control command to the queue and awaits for the response
 */
async function changeState({timestamp, id, payload}) {
  await queue.sendMessage({timestamp, id, payload})
  return queryResponse(id)
}

/**
 * @description queries response from state on an interval
 */
function queryResponse(id) {
  return new Promise((resolve,reject) => {
    const queryInterval = setInterval(() => {
      try {
        const response = queue.getMessageById(id) 
        if (response) {
          clearInterval(queryInterval)
          state = response.payload
          log += `${response}\n`
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