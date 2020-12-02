const fs = require('fs')
const {uploadObjectPromise, deleteObjectPromise, getObjectPromise} = require('@badgrhammer/s3-helpers')
const {ENV, FILE_PATH, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION} = process.env


/**
 * @description appends an incoming message to local log
 * @param {Promise<string>} message
 * @returns {Promise<>}
 */
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

/**
 * @description appends an incoming message to S3 log
 * @param {string} message
 * @returns {Promise<string>}
 */
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

/**
 * @description deletes local log file
 * @returns {Promise<>}
 */
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

/**
 * @description appends an incoming message to log
 * @returns {Promise<>}
 */
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


/**
 * @description Appends log message to existing logs. In test env just returns for ease of testing
 * in development appends to local file, in production appends to s3 file
 * @param {string} message
 */
async function appendToFile(message) {
  if (ENV === 'test') {
    return
  }
  if (ENV === 'development') {
    return appendToLocalFile(message)
  }
  return appendToS3File(message)
}

/**
 * @description Deletes log file. In test env returns for ease of development.
 * in development mode deletes local file and on production mode deletes S3 file
 */
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