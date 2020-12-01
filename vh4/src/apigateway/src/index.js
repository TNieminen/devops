require('dotenv-defaults').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const messagesController = require('./controllers/messages')
const stateController = require('./controllers/state')
const app = express()

const messagesRouter = express.Router()
const stateRouter = express.Router()
const logRouter = express.Router()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

messagesRouter.get('/',async(req,res,next) => {
  try {
    const response = await messagesController.getMessages()
    res.status(200).send(response)
  }
  catch (err) {
    next(err)
  }
})

stateRouter.put('/',async(req,res,next) => {
  try {
    const timestamp = Date.now()
    const id = Date.now()
    const {payload} = req.query
    const response = await stateController.changeState({timestamp,id,payload})
    if (response.error) {
      return res.status(400).send(response.error)
    }
    res.status(200).send(response)
  }
  catch (err) {
    next(err)
  }
})

stateRouter.get('/',async(req,res,next) => {
  try {
    const response = await stateController.getState()
    res.status(200).send(response)
  }
  catch (err) {
    next(err)
  }
})

logRouter.get('/',async(req,res,next) => {
  try {
    const response = await stateController.getLog()
    res.status(200).send(response)
  }
  catch (err) {
    next(err)
  }
})


app.use('/messages',messagesRouter)
app.use('/state', stateRouter)
app.use('/run-log', logRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  return res.status(err.status || 500).send(err.message)
})

module.exports = app
