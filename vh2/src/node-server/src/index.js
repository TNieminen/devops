const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const fetch = require('node-fetch')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', async(req,res) => {
  const {remoteAddress, remotePort, localAddress, localPort} = req.client
  const response = await fetch('http://go:8080').then(res => res.json())
  const service2Response = `Hello from ${response.localAddress} \nTo ${response.remoteAddress} \n`
  const service1Response = `Hello from ${localAddress}:${localPort} \nTo ${remoteAddress}:${remotePort} \n`
  res.send(service1Response + service2Response).status(200)
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
