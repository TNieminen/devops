require('dotenv-defaults').config()
const expect = require('expect')
const queue = require('./index')

describe('===== APIGATEWAY State Controller Queue - Unit Tests =====', () => {
  describe('==== QUEUE putMessage ====', () => {

    it('Should return messages object that contains our message', () => {
      const message = '{"id":1, "payload":"TEST"}'
      expect(queue.putMessage({content:message})).toMatchObject({1:'TEST'})
    })

    it('Should throw an error if message cannot be parsed', () => {
      const message = undefined
      expect(() => queue.putMessage({content:message})).toThrow()
    })

  })

  describe('==== QUEUE getMessageById ====', () => {

    it('Should return payload if id exists in messages', () => {
      queue.messages = {1:'TEST'}
      expect(queue.getMessageById(1)).toEqual('TEST')
    })

    it('Should return undefined if message with id does not exist', () => {
      expect(queue.getMessageById(2)).toEqual(undefined)
    })

  })

  describe('==== QUEUE sendMessage ====', () => {

    it('Should send message successfully', async() => {
      await expect(queue.sendMessage({id:1, payload:'TEST'})).resolves
    })

    it('Should throw error if id is not defined', async() => {
      await expect(queue.sendMessage({payload:'TEST'})).rejects
    })

    it('Should throw error if payload is not defined', async() => {
      await expect(queue.sendMessage({id:1})).rejects
    })

  })
  
  
})