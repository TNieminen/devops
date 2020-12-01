require('dotenv-defaults').config()
const expect = require('expect')
const queue = require('./index')

describe('===== APIGATEWAY State Controller Queue - Unit Tests =====', () => {

  afterEach(() => {
    queue.clearMessages()
  })

  describe('==== QUEUE putMessage ====', () => {

    it('Should return messages object that contains our message', () => {
      const message = '{"id":1, "payload":"TEST", "timestamp":1}'
      expect(queue.putMessage({content:message})).toMatchObject({1:{payload:'TEST', timestamp:1}})
    })

    it('Should throw an error if message cannot be parsed', () => {
      const message = undefined
      expect(() => queue.putMessage({content:message})).toThrow()
    })

  })

  describe('==== QUEUE getMessageById ====', () => {

    it('Should return payload if id exists in messages', () => {
      queue.messages[1] = 'TEST'
      expect(queue.getMessageById(1)).toEqual('TEST')
    })

    it('Should return undefined if message with id does not exist', () => {
      expect(queue.getMessageById(2)).toEqual(undefined)
    })

  })

  describe('==== QUEUE sendMessage ====', () => {

    it('Should send message successfully', async() => {
      const timestamp = new Date()
      const message = {id:1, payload:'TEST', timestamp}
      await expect(await queue.sendMessage(message)).resolves
    })

    it('Should throw error if id is not defined', async() => {
      const timestamp = new Date()
      const message = {payload:'TEST', timestamp}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Queue message has to have and id'))
    })

    it('Should throw error if payload is not defined', async() => {
      const timestamp = new Date()
      const message = {id:1, timestamp}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without payload'))
    })

    it('Should throw error if timestamp is not defined', async() => {
      const message = {id:1, payload:'TEST'}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without timestamp'))
    })

    it('Should throw error if timestamp is not a valid date object', async() => {
      const message = {id:1, payload:'TEST', timestamp: Date.now()}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Timestamp needs to be a valid date object'))
    })



  })

  describe('==== QUEUE clearMessages ====', () => {
    it('Should clear all messages', () => {
      queue.messages[1] = 'TEST'
      expect(queue.clearMessages()).toEqual({})
    })
  })
  
  
})