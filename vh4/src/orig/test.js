require('dotenv-defaults').config()
const expect = require('expect')
const Orig = require('./index')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')


let orig = {}

describe('===== ORIG =====', () => {


  beforeEach(() => {
    orig = new Orig()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Orig()).not.toThrow()
    })    
  })

  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      orig.initQueue()
      expect(orig.queue).toMatchObject(mockQueue)
    })
  })
})