require('dotenv-defaults').config()
const expect = require('expect')
const state = require('./index')
const queue = require('./queue')

describe('===== APIGATEWAY State Controller - Unit Tests =====', () => {
  describe('==== PUT Paused ====', () => {
  
    it('Should pause the service successfully', async() => {
      // insert response message to state
      const id = Date.now()
      queue.putMessage({content:JSON.stringify({id:1, payload:'TEST'})})
      await expect(state.pauseService(id)).resolves.toEqual('TEST')
    })

    xit('Should throw an error if the request fails', async() => {
      // executing this test requires figuring out how to mock request and response behaviour from rabbitmq
      await expect(state.pauseService(id)).rejects
    })

    // TODO: we could add a TTL to messages, but that is out of the scope now
    // https://www.rabbitmq.com/ttl.html
    // it('Should throw an error if the request times out', async() => {
    //   await expect(state.pauseService()).rejects
    // })

  })
  
})

/**
 * PAUSED
 * Send message to ORIG, wait for confirmation and set state to PAUSED
 *  - fail, respond 500 with error
 *  - pass, respond 200 with state
 */

/**
  * RUNNING
  * Send message to ORIG, wait for confirmation and set state to RUNNING
  * - fail, respond 500 with error
  * - pass, respond 200 with state
  */

/**
 * INIT
 * scale all dynos to 1 instance, set state to RUNNING
 *  - fail, respond 500 with error
 *  - pass, response 200 with state
 */

/**
 * SHUTDOWN
 * scale all dynos to 0 instances, set state to SHUTDOWN
 * - fail, respond 500 with error
 * - pass, respond 200 with state
 */

// in dev you can stop one with these instructions
// https://www.thegeekstuff.com/2016/04/docker-compose-up-stop-rm/