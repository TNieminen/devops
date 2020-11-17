# Description
This services uses rabbitMQ as its messaging backbone and provides the following functionalities:
- ORIG publishes 3 messages to topic **my.o**, each with an interval of 3 seconds.
- Message content shall be:
  - “MSG_{n}” without quotes, where {n} is replaced with an incremental value within [1..3]. That  is:
      - MSG_1
      - MSG_2
      - MSG_3
  