const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const fs = require('fs')
const app = express()
const dataPath = '../../data/output.txt'

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', async(req,res) => {
  fs.readFile(path.resolve(__dirname,dataPath),'utf-8',(err, data) => {
    if (!err) {
      return res.status(200).send(data)
    }
    if (err.code === 'ENOENT') {
      return res.status(404).send('Service is starting up, wait a moment')
    }
    return res.status(500).send(err.toString())
  })
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
