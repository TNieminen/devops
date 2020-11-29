require('dotenv-defaults').config()
const request = require('supertest')
const expect = require('expect')
const app = require('./')

const agent = request.agent(app)


describe('===== HTTPSERV Integration tests =====', () => {
  it('Should also pass', async() => {
    await agent.get('/').expect(404)
  })
})