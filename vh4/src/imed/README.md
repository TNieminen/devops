# Description
This services uses rabbitMQ as its messaging backbone and provides the following functionalities:
- Subscribes for messages from my.o (sent by orig)
- Publishes message to my.i after one second delay from message received
- Possible message combinations include (depending on orig input)
  - Got MSG_1
  - Got MSG_2
  - Got MSG_3
- Service can be in states
  - SHUTDOWN - messages are no longer received
  - INIT - messages can be received again