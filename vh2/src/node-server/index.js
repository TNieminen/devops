var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', (req,res)=>{
  const { remoteAddress, remotePort, localAddress, localPort } = req.client
  console.log("Req came from " + req.client.remoteAddress + ":" + req.client.remotePort);
  console.log("Req served at " + req.client.localAddress + ":" + req.client.localPort);
  res.send({ remoteAddress, remotePort, localAddress, localPort }).status(200)
  // res.sendStatus(200)
});
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
