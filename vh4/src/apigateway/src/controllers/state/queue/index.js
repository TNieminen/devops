const messages = {

}


function putMessage(msg) {
  const message = JSON.parse(msg.content)
  const {id, payload} = message
  messages[`${id}`] = payload
  return messages
}

function getMessageById(id) {
  return messages[`${id}`]
}


module.exports = {
  putMessage,
  getMessageById,
  messages
}