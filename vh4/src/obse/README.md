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
- OBSE writes the string into a file in a Docker volume
    - If OBSE is ran multiple times, the file must be deleted/cleared on startup