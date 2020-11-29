const fs = require('fs')
const path = require('path')
const {getObjectPromise} = require('@badgrhammer/s3-helpers')
const {ENV,FILE_PATH, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION} = process.env

function readLocalFile() {
  return new Promise((resolve,reject) => {
    fs.readFile(path.resolve(__dirname,FILE_PATH),'utf-8',(err, data) => {
      if (!err) {
        return resolve(data)
      }
      return reject(err)
    })
  })
}

function readS3File() {
  return getObjectPromise({
    AWS_ACCESS_KEY_ID, 
    AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET,
    AWS_REGION
  },{
    Key:FILE_PATH
  }).then(data => data.Body)
}

function readFile() {
  if (ENV !== 'production') {
    return readLocalFile()
  }
  return readS3File()
}

module.exports = {
  readFile
}