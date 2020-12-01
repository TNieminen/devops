require('dotenv-defaults').config()
const expect = require('expect')
const queue = require('./index')

describe('===== APIGATEWAY State Queue - Unit Tests =====', () => {

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
      const timestamp = Date.now()
      const message = {id:1, payload:'TEST', timestamp, type:'topic'}
      await expect(await queue.sendMessage(message)).resolves
    })

    it('Should throw error if id is not defined', async() => {
      const timestamp = Date.now()
      const message = {payload:'TEST', timestamp, type:'topic'}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Queue message has to have and id'))
    })

    it('Should throw error if payload is not defined', async() => {
      const timestamp = Date.now()
      const message = {id:1, timestamp, type:'topic'}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without payload'))
    })

    it('Should throw error if timestamp is not valid', async() => {
      const message = {id:1, payload:'TEST', type:'topic'}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Cannot send message without valid timestamp'))
    })

    it('Should throw error if type is not defined', async() => {
      const timestamp = Date.now()
      const message = {id:1, timestamp, payload:'TEST'}
      await expect(queue.sendMessage(message)).rejects.toEqual(new Error('Message type needs to either topic or fanout'))
    })

  })

  describe('==== QUEUE clearMessages ====', () => {
    it('Should clear all messages', () => {
      queue.messages[1] = 'TEST'
      expect(queue.clearMessages()).toEqual({})
    })
  })
  
  
})