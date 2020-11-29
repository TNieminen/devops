function checkStatus(res) {
  if (res.ok) { // res.status >= 200 && res.status < 300
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
