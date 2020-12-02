# Description
This services uses rabbitMQ as its messaging backbone and provides the following functionalities:
- ORIG publishes 3 messages to topic **my.o**, each with an interval of 3 seconds.
- Message content shall be:
  - “MSG_{n}” without quotes, where {n} is replaced with an incremental value within [1..3]. That  is:
      - MSG_1
      - MSG_2
      - MSG_3
- Service can be in states which are send via message from api gateway
  - PAUSED - messages stop sending
  - RUNNING - messages start sending again
  - SHUTDOWN - in dev stops sending messages, in production container is scaled down
  - INIT - container is starting up, will start delivering messages when started. State automatically set to RUNNING