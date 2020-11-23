const request = require('supertest')
const expect = require('expect')
const app = require('./')

const agent = request.agent(app)


describe('===== Base Route =====', () => {
  it('should pass', async() => {
    expect(true).toEqual(true)
  })
  it('should fail', async() => {
    expect(true).toEqual(false)
  })
})