# General

Implements an API service to control IMED, ORIG and OBSE workers and HTTPSERV api. On initialization the service is set to Running state and sending requests to it is safe
against booting up background services because of promise based messaging.

The service implements these functions:


**GET /messages**

Returns all message registered with OBSE-service. Assumed implementation: Forwards the request to HTTPSERV and returns the result.

**PUT /state(payload “INIT”, “PAUSED”, “RUNNING”, “SHUTDOWN”)**

PAUSED = ORIG service is not sending messages
RUNNING = ORIG service sends messages if the new state is equal to previous nothing happens.
INIT = everything is in the initial state and ORIG starts sending again,state is set to RUNNING
SHUTDOWN = all containers are stopped

**GET /state**

get the value of state

**GET /run-log**

Get information about state changes
Example output:
2020-11-01T06:35:01.373Z:INIT
2020-11-01T06:40:01.373Z:PAUSED
2020-11-01T06:40:01.373Z:RUNNING

**GET /node-statistic (optional)**

Return core statistics (the five (5) most important in your mind) of the RabbitMQ. (For getting the information see https://www.rabbitmq.com/monitoring.html)Output should syntactically correct and intuitive JSON. E.g:{ “fd_used”: 5, ...}GET /queue-statistic (optional)Return a JSON array per your queue. For each queue return “message delivery rate”, “messages publishing rate”, “messages delivered recently”, “message published lately”. (For gettingthe information see https://www.rabbitmq.com/monitoring.html)Modify the ORIG service to send messages forever untilpause pausedor stopped.Implement acopy of the OBSE process


you can call these endpoints for instance with:

*You can put the service in SHUTDOWN state with*
`curl -X PUT localhost:8081/state?payload=SHUTDOWN`

*You can put the service in INIT state with*
`curl -X PUT localhost:8081/state?payload=INIT`

*You can put the service in PAUSE state with*
`curl -X PUT localhost:8081/state?payload=PAUSE`

*You can put the service in RUNNING state with*
`curl -X PUT localhost:8081/state?payload=SHUTDOWN`

*You can get the state of the service with*
`curl localhost:8081/state`

*You can get a timestamped log of state changes with*
`curl localhost:8081/run-log`

*You can get a log of messages sent (and stored by obse) with*
`curl localhost:8081/messages`