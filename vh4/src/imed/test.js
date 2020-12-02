const expect = require('expect')
const Imed = require('./index')
const sinon = require('sinon')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')

describe('===== IMED =====', () => {
  beforeEach(() => {
    imed = new Imed()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Imed()).not.toThrow()
    })
    it('Should set default state to be RUNNING', async() => {
      expect(imed.state).toEqual('RUNNING')
    })    
  })
  
  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      imed.initQueue()
      expect(imed.queue).toMatchObject(mockQueue)
    })
  })
})