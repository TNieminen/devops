const expect = require('expect')
const Orig = require('./index')

describe('===== ORIG =====', () => {
  it('==== constructor ====', async() => {
    expect(() => new Orig()).not.toThrow()
  })
})