const S3 = require('aws-sdk/clients/s3')
/**
 * defaultS3UploadOptions is used inside aws-s3 component to be a placeholder for
 * s3 object metadata. It mostly serves as a tool for documentation.
 * A question mark near the variable name means that the variable is optional
 * @typedef {Object} defaultS3UploadOptions
 * @property {string} Key s3 path bucket path and filname
 * @property {string|Buffer} Body  s3 path bucket path and filename
 * @property {{}} [Metadata] - Free-form metadata object
 * @property {string} [ContentType] - The content type such as image/jpeg
 * @property {string} [Tagging] - key-value tags to be added to the object
 * @property {Date} [Expires] - cache expiration date
 * @property {string} [ContentEncoding] - encoding
 * @property {string} [ContentLanguage] - language
 * @property {string} [ServerSideEncryption] - encryption
 */

const defaultS3UploadOptions = {
  Key: '',
  Body: '',
  Metadata: {},
  ContentType: 'application/octet-stream',
  Tagging: '',
  Expires: '',
  ContentEncoding: '',
  ContentLanguage: '',
  ServerSideEncryption: ''
}

/**
 * S3 upload promise.
 *
 * @param {{AWS_ACCESS_KEY_ID:string,AWS_SECRET_ACCESS_KEY:string,AWS_BUCKET:string,AWS_REGION:string}} awsOptions - AWS information needed for initialization.
 * @param {defaultS3UploadOptions} s3Options - Check typedef defaultS3UploadOptions in function definition file for more information and to see what variables are optional (most of them are)
 *  - Required: Key, Body.
 * @description uploadPromise Uploads a given data Body s3 path Key
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
 * @returns {Promise<{Location: string, ETag: string, Bucket: string, Key: string}|Error>}  Returns the response data object of s3.
 */
exports.uploadPromise = ({AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION}, s3Options) => new Promise((resolve, reject) => {
  const s3 = new S3({
    params: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      Bucket: AWS_BUCKET,
    },
    apiVersion: '2006-03-01',
    region: AWS_REGION,
  })
  const options = Object.assign(defaultS3UploadOptions, s3Options)
  Object.keys(options).forEach(key => (options[key].length === 0) && delete options[key])
  s3.upload(options, (err, data) => {
    if (err) { reject(err) }
    resolve(data)
  })
})

/**
 * Object download promise.
 *
 * @param {{AWS_ACCESS_KEY_ID:string,AWS_SECRET_ACCESS_KEY:string,AWS_BUCKET:string,AWS_REGION:string}} awsOptions - AWS information needed for initialization.
 * @param {{Key: string}} s3Options - S3 Key to be fetched.
 * @description getObjectPromise downloads an s3 file into a buffer
 * @returns {Promise<getObjectResponse>}  Returns the response data object of s3.
 * */
exports.getObjectPromise = ({AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION}, s3Options) => {
  const s3 = new S3({
    params: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      Bucket: AWS_BUCKET,
    },
    apiVersion: '2006-03-01',
    region: AWS_REGION,
  })
  return s3.getObject(s3Options).promise()
    .then(response => response.Body)
    .catch((err) => { throw err })
}
