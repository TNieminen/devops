const fetch = require('node-fetch')
const utils = require('../../utils')
const {HTTPSERV_URL, DOCKER} = process.env

const serverUrl = DOCKER ? HTTPSERV_URL.replace('localhost','httpserv') : HTTPSERV_URL

function getMessages() {
  return fetch(serverUrl)
    .then(res => utils.checkStatus(res))
    .then(res => res.text())
}

module.exports = {
  getMessages
}