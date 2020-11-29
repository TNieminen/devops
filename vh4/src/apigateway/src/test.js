const request = require('supertest')
const expect = require('expect')
const app = require('.')

const agent = request.agent(app)


describe('===== API Gateway =====', () => {
  it('should pass', async() => {
    expect(true).toEqual(true)
  })
})