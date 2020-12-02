const expect = require('expect')
const Obse = require('./')
const mockQueue = require('@badgrhammer/rabbitmq-helpers/src/mock')

let obse
describe('===== OBSE =====', () => {

  beforeEach(() => {
    obse = new Obse()
  })

  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Obse()).not.toThrow()
    })
    it('Should set default state to be RUNNING', async() => {
      expect(obse.state).toEqual('RUNNING')
    })    
  })
  
  describe('==== initQueue ====', () => {
    it('Should return mock queue implementation in test env', () => {
      obse.initQueue()
      expect(obse.queue).toMatchObject(mockQueue)
    })
  })


})