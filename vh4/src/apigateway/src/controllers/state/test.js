require('dotenv-defaults').config()
const expect = require('expect')
const state = require('./index')
const queue = require('./queue')

describe('===== APIGATEWAY State Controller - Unit Tests =====', () => {
  describe('==== PUT ====', () => {
  
    it('Should PAUSE the service successfully', async() => {
      // insert response message to state
      const id = Date.now()
      queue.putMessage({content:JSON.stringify({id, payload:'PAUSE'})})
      await expect(state.changeState({id, payload:'PAUSE'})).resolves.toEqual('PAUSE')
    })

    it('Should set the service to RUNNING successfully', async() => {
      // insert response message to state
      const id = Date.now()
      queue.putMessage({content:JSON.stringify({id, payload:'RUNNING'})})
      await expect(state.changeState({id, payload:'RUNNING'})).resolves.toEqual('RUNNING')
    })

    it('Should reject if payload is not defined', async() => {
      // insert response message to state
      const id = Date.now()
      queue.putMessage({content:JSON.stringify({id, payload:'RUNNING'})})
      await expect(state.changeState({id})).rejects
    })

    it('Should reject if id is not defined', async() => {
      // insert response message to state
      const id = Date.now()
      queue.putMessage({content:JSON.stringify({id, payload:'RUNNING'})})
      await expect(state.changeState({payload:'RUNNING'})).rejects
    })

    xit('Should reject because response was not received in time', async() => {
      // TODO: if we add timeout handling this is a good place to test it
      // we could add a TTL to messages, but that is out of the scope now
      // https://www.rabbitmq.com/ttl.html
    })
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