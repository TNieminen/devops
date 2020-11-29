require('dotenv-defaults').config() // for some reason adding sinon tests wipes the process.env, reading here fixes the issue
const expect = require('expect')
const sinon = require('sinon')
const utils = require('../../utils')
const {getRoot} = require('.')

let stub 

describe('===== HTTPSERV Root Controller - Unit Tests =====', () => {  
  beforeEach(() => {
    stub = sinon.stub(utils, 'readFile')
  })
  afterEach(() => {
    stub.restore()
  })
  it('Should return correct string return', async() => {
    stub.returns('test')
    const data = await getRoot()
    await expect(data).toEqual('test')
    stub.restore()
  })
  it('Should return error status 404 on ENOENT', async() => {
    const err = new Error('test')
    err.code = 'ENOENT'
    stub.throws(err)
    await expect(getRoot()).rejects.toMatchObject(expect.objectContaining({status:404}))
  })
  it('Should return error status 404 on NoSuchKey', async() => {
    const err = new Error('test')
    err.code = 'NoSuchKey'
    stub.throws(err)
    await expect(getRoot()).rejects.toMatchObject(expect.objectContaining({status:404}))
  })
  it('Should throw error when error is not to do with file found', async() => {
    const err = new Error('test')
    stub.throws(err)
    await expect(getRoot()).rejects.toEqual(err)
  })
})