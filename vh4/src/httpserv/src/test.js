require('dotenv-defaults').config()
const request = require('supertest')
const expect = require('expect')
const app = require('./')

const agent = request.agent(app)

// TODO: integration tests
describe('===== HTTPSERV Integration tests =====', () => {
  it('Should pass', async() => {
    expect(true).toEqual(true)
  })
})