# General
Implement an APIgateway service that provides the external interface to the system. This service should be exposed from port 8081. The API gateway should provide the following REST-like API 

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
