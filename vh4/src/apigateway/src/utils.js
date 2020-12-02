/**
 * @description checks the status of response and throws and error if
 * NOT res.status >= 200 && res.status < 300
 */
async function checkStatus(res) {
  if (res.ok) { 
    return res
  } else {
    const error = new Error()
    error.status = res.status
    error.message = res.message
    throw error
  }
}

module.exports = {
  checkStatus
}
