require('dotenv-defaults').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const {readFile} = require('./utils')
const app = express()


app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', async(req,res) => {
  try {
    const data = await readFile()
    return res.status(200).send(data)
  }
  catch (err) {
    if (err.code === 'ENOENT' || err.code === 'NoSuchKey') {
      return res.status(404).send('Service is starting up, wait a moment')
    }
    return res.status(500).send(err.toString())
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
