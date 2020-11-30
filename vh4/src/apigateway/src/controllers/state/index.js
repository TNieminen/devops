const {ENV} = process.env
const queue = require('./queue')

// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000
const defaultState = 'SHUTDOWN'
let state = defaultState

/**
 * @description sends a pause control command to the queue and awaits for the response
 */
async function changeState({id, payload}) {
  await queue.sendMessage({id, payload})
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
          state = response
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

module.exports = {
  changeState,
  getState,
  clearState
}