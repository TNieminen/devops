const fetch = require('node-fetch')
const utils = require('../../utils')
const {HTTPSERV_URL} = process.env

function getMessages() {
  console.log(HTTPSERV_URL)
  return fetch(HTTPSERV_URL)
    .then(res => utils.checkStatus(res))
    .then(res => res.text())
}

module.exports = {
  getMessages
}