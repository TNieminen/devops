require('dotenv-defaults').config()
const expect = require('expect')
// const sinon = require('sinon')
const state = require('./index')

let stub

describe('===== APIGATEWAY State Controller - Unit Tests =====', () => {
  describe('==== PUT Paused ====', () => {
    beforeEach(() => {
      // stub = sinon.stub(fetch, 'Promise')
    })
    afterEach(() => {
      // stub.restore()
    })
  
    it('Should pause the service successfully', async() => {
      // // stub fetch response
      // stub.returns(Promise.resolve({ok:true}))
      await expect(state.pauseService()).resolves
    })

    it('Should throw an error if the request fails', async() => {
      // // stub fetch response
      // stub.returns(Promise.resolve({ok:true}))
      await expect(state.pauseService()).rejects
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