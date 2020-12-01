require('dotenv-defaults').config()
const expect = require('expect')
const state = require('./index')

describe('===== APIGATEWAY State Controller - Unit Tests =====', () => {
  afterEach(() => {
    state.clearState()
    state.clearLog()
  })

  beforeEach(() => {
  })

  describe('==== PUT ====', () => {

    it('Should PAUSE the service successfully', async() => {
      // insert response message to state
      const id = Date.now()
      const timestamp = Date.now()
      const payload = 'PAUSE'
      const message = {id, payload, timestamp}
      await expect(state.changeState(message)).resolves.toEqual({payload, timestamp})
    })

    it('Should set the service to RUNNING successfully', async() => {
      // insert response message to state
      const id = Date.now()
      const timestamp = Date.now()
      const payload = 'RUNNING'
      const message = {id, payload, timestamp}
      await expect(state.changeState(message)).resolves.toEqual({payload, timestamp})
    })

    it('Should set the service to SHUTDOWN successfully', async() => {
      // insert response message to state
      const id = Date.now()
      const timestamp = Date.now()
      const payload = 'SHUTDOWN'
      const message = {id, payload, timestamp}
      await expect(state.changeState(message)).resolves.toEqual({payload, timestamp})
    })

    it('Should set the service to INIT successfully', async() => {
      // insert response message to state
      const id = Date.now()
      const timestamp = Date.now()
      const payload = 'INIT'
      const message = {id, payload, timestamp}
      await expect(state.changeState(message)).resolves.toEqual({payload, timestamp})
    })

    it('Should reject if payload is not defined', async() => {
      await expect(state.changeState({id:Date.now()})).rejects.toThrow()
    })

    it('Should reject if id is not defined', async() => {
      await expect(state.changeState({payload:'RUNNING'})).rejects.toThrow()
    })

    it('Should reject if timestamp is not defined', async() => {
      await expect(state.changeState({id:Date.now(), payload:'RUNNING'})).rejects.toThrow()
    })

    xit('Should reject because response was not received in time', async() => {
      // TODO: if we add timeout handling this is a good place to test it
      // we could add a TTL to messages, but that is out of the scope now
      // https://www.rabbitmq.com/ttl.html
    })
  })

  describe('==== GET ====', () => {

    afterEach(() => {
      state.clearState()
      state.clearLog()
    })

    describe('/state', () => {

      it('Should return shutdown state if we have no state information set', async() => {
        expect(state.getState()).toEqual('SHUTDOWN')
      })
      it('Should return new state after update', async() => {
        // set state to running
        const timestamp = Date.now()
        await state.changeState({timestamp, id:1, payload:'RUNNING'})
        // expect this to be reflected in local state
        expect(state.getState()).toEqual('RUNNING')
      })  

    })

    describe('/run-log', () => {
      it('Should return a log when it exists', async() => {
        // set state to running
        const timestamp = Date.now()
        await state.changeState({timestamp, id:1, payload:'RUNNING'})
        expect(state.getLog()).toEqual(`${new Date(timestamp).toISOString()} RUNNING\n`)
      })
      it('Should append to, not replace, old log', async() => {
        const firstChange = {timestamp:Date.now(), id:1, payload:'RUNNING'}
        const secondChange = {timestamp:Date.now(), id:2, payload:'PAUSED'}
        await state.changeState(firstChange)
        await state.changeState(secondChange)
        const firstLog = `${new Date(firstChange.timestamp).toISOString()} ${firstChange.payload}\n`
        const secondLog = `${new Date(secondChange.timestamp).toISOString()} ${secondChange.payload}\n`
        expect(state.getLog()).toEqual(firstLog + secondLog)
      })
      it('Should return empty string if no log exists', async() => {
        expect(state.getLog()).toEqual('')
      })
    })
    
  })

  describe('==== sendMessage ====', () => {

    it('Should send RUNNING message successfully', async() => {
      const timestamp = Date.now()
      const message = {id:1, payload:'RUNNING', timestamp, type:'topic', topic:'mytopic'}
      await expect(await state.sendMessage(message)).resolves
    })

    it('Should throw error if id is not defined', async() => {
      const timestamp = Date.now()
      const message = {payload:'TEST', timestamp, type:'topic'}
      await expect(state.sendMessage(message)).rejects.toEqual(new Error('Queue message has to have and id'))
    })

    it('Should throw error if payload is not defined', async() => {
      const timestamp = Date.now()
      const message = {id:1, timestamp, type:'topic'}
      await expect(state.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without payload'))
    })

    it('Should throw error if timestamp is not valid', async() => {
      const message = {id:1, payload:'TEST', type:'topic'}
      await expect(state.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without valid timestamp'))
    })

    it('Should throw error if type is not defined', async() => {
      const timestamp = Date.now()
      const message = {id:1, timestamp, payload:'TEST'}
      await expect(state.sendMessage(message)).rejects.toEqual(new Error('Message type needs to either topic or fanout'))
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