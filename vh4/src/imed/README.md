# Description
This services uses rabbitMQ as its messaging backbone and provides the following functionalities:
- Subscribes for messages from my.o
- Publishes message to my.i
- Every time IMED receives a message from topic my.o:
    - IMED waits for 1 second
    - After waiting, IMED publishes “Got {received message}” without quotes to topic my.i
    - Replace “{received message}” with the content of the received message