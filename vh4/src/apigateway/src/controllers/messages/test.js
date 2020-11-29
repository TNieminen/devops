require('dotenv-defaults').config()
const expect = require('expect')
const fetch = require('node-fetch')
const sinon = require('sinon')
const messages = require('./index')
const {HTTPSERV_URL} = process.env

let stub

describe('===== APIGATEWAY Messages Controller - Unit Tests =====', () => {
  beforeEach(() => {
    stub = sinon.stub(fetch, 'Promise')
  })
  afterEach(() => {
    stub.restore()
  })

  it('Should return text parsed response on success', async() => {
    // stub fetch response
    const testResponse = 'test response'
    stub.returns(Promise.resolve({ok:true, text:() => testResponse}))
    await expect(messages.getMessages()).resolves.toMatch(testResponse)
  })
  it('Should throw error on a failed response', async() => {
    // stub fetch response
    stub.returns(Promise.resolve({ok:false, status:500}))
    await expect(messages.getMessages()).rejects.toMatchObject(expect.objectContaining({status:500}))
  })
})