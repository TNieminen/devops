const fetch = require('node-fetch')
const utils = require('../../utils')
const {HTTPSERV_URL, DOCKER} = process.env

const serverUrl = DOCKER ? HTTPSERV_URL.replace('localhost','httpserv') : HTTPSERV_URL

/**
 * @description gets messages from HTTPSERV
 * @returns {{string}}
 */
function getMessages() {
  return fetch(serverUrl)
    .then(res => utils.checkStatus(res))
    .then(res => res.text())
}

module.exports = {
  getMessages
}