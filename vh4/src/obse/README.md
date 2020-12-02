# Description
This services uses rabbitMQ as its messaging backbone and provides the following functionalities:

- Every time OBSE receives a message from any of the topics:
    - OBSE builds a string “{timestamp} Topic {topic}: {message}” without quotes
        - {topic} is the topic that delivered the message
        - {message} is the message body
        - {timestamp} must be in the format YYYY-MM-DDThh:mm:ss.sssZ (ISO 8601)
            - Time zone is UTC
        - Do not print ‘{’ and ‘}’
        - For example: 2020-10-01T06:35:01.373Z Topic my.o: MSG_1
- OBSE writes the string into a file in a Docker volume if it Docker env and to data file if in local dev. If used in production saves output to S3
- If OBSE is ran multiple times, the file must be deleted/cleared on startup
- Service can be in states which are send via message from api gateway
  - SHUTDOWN - stops receiving messages, in production container is scaled down
  - INIT - starts receiving message, in production container is scaled up (by api gateway not this service)