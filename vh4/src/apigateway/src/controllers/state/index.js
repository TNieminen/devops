const {ENV} = process.env
const queue = require('./queue')

// make queryinterval run faster in test env
const queryIntervalTime = ENV === 'test' ? 10 : 1000

/**
 * @description sends a pause control command to the queue and awaits for the response
 */
async function pauseService(id) {
  await queue.sendMessage({id, payload:'PAUSE'})
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


module.exports = {
  pauseService
}