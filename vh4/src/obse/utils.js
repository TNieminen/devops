const fs = require('fs')
const {uploadObjectPromise, deleteObjectPromise, getObjectPromise} = require('@badgrhammer/s3-helpers')
const {ENV, FILE_PATH, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION} = process.env



function appendToLocalFile(message) {
  return new Promise((resolve,reject) => {
    fs.appendFile(FILE_PATH,`${message}\n`,(err) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

async function appendToS3File(message) {
  let oldData = ''
  try {
    oldData = await getObjectPromise({
      AWS_ACCESS_KEY_ID, 
      AWS_SECRET_ACCESS_KEY,
      AWS_BUCKET,
      AWS_REGION
    },{
      Key:FILE_PATH
    }).then(data => data.Body)
  }
  catch (err) {
    if (err.code !== 'NoSuchKey') {
      throw err
    }
  }
  return uploadObjectPromise({
    AWS_ACCESS_KEY_ID, 
    AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET,
    AWS_REGION
  },{
    Body: `${oldData}${message}\n`,
    Key:FILE_PATH
  })
}

function deleteLocalFile() {
  return new Promise((resolve,reject) => {
    fs.unlink(FILE_PATH,async(err) => {
      if (err && err.code !== 'ENOENT') {
        return reject(err)
      }
      return resolve()
    })
  })
}

function deleteS3File() {
  return deleteObjectPromise({
    AWS_ACCESS_KEY_ID, 
    AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET,
    AWS_REGION
  },{
    Key:FILE_PATH
  })
}



async function appendToFile(message) {
  if (ENV === 'test') {
    return
  }
  if (ENV === 'development') {
    return appendToLocalFile(message)
  }
  return appendToS3File(message)
}

async function deleteFile() {
  if (ENV === 'test') {
    return
  }
  if (ENV === 'development') {
    return deleteLocalFile()
  }
  return deleteS3File()
}

module.exports = {
  appendToFile,
  deleteFile
}