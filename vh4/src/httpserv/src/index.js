require('dotenv-defaults').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const {whitelist, matchOrigin} = require('./utils')
const rootController = require('./controllers/root')
const {ENV} = process.env
const app = express()


app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cors({
  origin(origin, callback) {
    const whitelistEnv = whitelist[ENV] || whitelist.development
    return !origin || matchOrigin(origin, whitelistEnv) ? callback(null, true) : callback(new Error('Not allowed by CORS'))
  },
}))
app.options('*', cors()) // include before route
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))


/**
 * @description router for GET /
 * returns a logs string of send and stored messages
 */
app.use('/', async(req,res) => {
  try {
    const data = await rootController.getRoot()
    return res.status(200).send(data)
  }
  catch (err) {
    return res.status(err.status || 500).send(err.toString())
  }
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
