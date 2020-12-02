const utils = require('../../utils')

/**
 * @description controller for getting log strings
 * @returns {Promise<string>}
 */
module.exports.getRoot = async() => {
  try {
    const data = await utils.readFile()
    return data
  }
  catch (err) {
    // Handle missing data
    if (err.code === 'ENOENT' || err.code === 'NoSuchKey') {
      const error = new Error('Service is starting up, wait a moment')
      error.status = 404
      throw error
    }
    throw err
  }
}