const expect = require('expect')
const Obse = require('./')

describe('===== OBSE =====', () => {
  describe('==== constructor ====', () => {
    it('Should create a new instance without errors', async() => {
      expect(() => new Obse()).not.toThrow()
    })  
  })

})