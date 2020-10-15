# Description

The goal of this repository is to implement message routing with topics named as
- my.o
- my.i
using Docker.

Functionality

**IMED(Intermediate)**
- Subscribes for messages from my.o
- Publishes message to my.io
  
**OBSE(Observer)**
- Subscribes for all messages within the network, therefore receiving from both my.o and my.i
- Stores the messages into a file

**HTTPSERV**
- When requested, returns content of the file created by OBSE
  
Additional notes
- The project uses RabbitMQ as the message broker

## Running the project

`docker-compose up --build`

you should be able to get the system output served by httpserv module at

`curl localhost:8080`

## Project structure

- Root includes assigment.pdf which includes detailed instructions on the project and our docker-compose config file
- Each aforementioned module is listed under source with their own package.json, env, README and so on

## Development

If you want to develop individual files against rabbit, you can initialize the service separately with
`docker run -d -p 15672:15672 -p 5672:5672 --name rabbit-test-for-medium rabbitmq:3-management`
and access it on the browser at `localhost:15672` with password and username = guest


## Notes on docker

### Up & Down

```
docker-compose up --build -d
```
*remove -d if you want to see logs from the instances*

when you want to take the service run in root

```
docker-compose down
```

### On volumes

Volumes can be shared between containers, there are unnamed and named containers.
Containers can be initialized with data or they can be filled with data afterwards.
For instance in this project we are sharing the rabbitmq/index.js file with a volume
but just initialing an empty data volume to be shared in runtime.

Volumes are stored on the host machine and can , but normally should not, be accessed as sudo
```sh
$ sudo su
$ cd /var/lib/docker/volumes
$ ls
```

### Useful commands 

NOTE!
/bin/ash for alpine
/bin/bash for other linux distros

**Ssh into a running container with**
`docker exec -it <container name> /bin/bash`

**Run an existing image in interactive mode**
 `docker run -it <container name> /bin/ash`

**Inpect anything**
`docker inspect <container name>`
`docker inspect <image name>`

**List things**
running containers
`docker ps`
all containers
`docker container ls --all`
all images
`docker image ls --all`
all volumes
`docker volume ls`

**Remove non essential stuff**
remove unused containers
`docker container prune`
remove unused images
`docker image prune`
remove unused volumes
`docker volume prune`
if you want to remove absolutely all of one category add the `--all` flag



### Sources

https://stackoverflow.com/questions/31746182/docker-compose-wait-for-container-x-before-starting-y
https://stackoverflow.com/questions/47710767/what-is-the-alternative-to-condition-form-of-depends-on-in-docker-compose-versio
https://stackoverflow.com/questions/57065750/docker-compose-volume-overrides-copy-in-multi-stage-build
https://docs.docker.com/config/containers/start-containers-automatically/#use-a-restart-policy
https://docs.docker.com/engine/reference/commandline/container_prune/


## RabbitMQ

https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
http://www.squaremobius.net/amqp.node/channel_api.html#channel

### Publisher
Sends messages to an exchange or directly to a queue

### Consumer
Initializes a named or unnamed queue which receives either direct messages
from a producer or messages matching the subscribed topic from an exchange

### Queue
a client can be part of a queue and receive messages from it.

### Receiving messages
How we actually receive a message depends on how we have subscribed, but 
given that this is how we receive and handle a message

```js
channel.consume(queue,((message) => {
    if (message !== null) {
      channel.ack(message) // https://www.rabbitmq.com/confirms.html
      messageCallback(null, message.content.toString())
    }
}))
```

### Sending messages
You can send a message to a queue with
```js
const options = {
    persistent:true // The message will survive broker restarts provided it’s in a queue that also survives restarts.
  }
channel.sendToQueue(queue,Buffer.from(message),options)
```

### Publishing a message
You can publish a message in an exchange with.
```js
channel.publish('exchange-name','', Buffer.from('something to do'))
```
instead of the empty string, you can define a routing key to deliver the message
only to queues that are subscribed to the route

### Exchange
a queue can be part of an exchange, the exchange can be in different modes.

#### Fanout
In this mode the exchange sends all messages to all queues

```js
// initialize what exchange we are part of
channel.assertExchange('name-of-exchange', 'fanout', {
  durable: false
});

// if you leave the queue name empty, the server generates one on random
// setting exclusive = true scopes the queue to the connection
channel.assertQueue('', { exclusive: true }, (err, q) => {
  // we leave the last value empty so that we will receive all the messages
  channel.bindQueue(q.queue, 'name-of-exchange', '');
})
```

#### Direct
In this mode we send messages only directly to queues that have bound themselves
to listen to the messages:

```js
// initialize what exchange we are part of
channel.assertExchange('name-of-exchange', 'direct', {
  durable: false
});

// if you leave the queue name empty, the server generates one on random
channel.assertQueue('', { exclusive: true }, (err, q) => {
  channel.bindQueue(q.queue, 'name-of-exchange', route);
})

```

### Topic

Sometimes a simple route is not enough, for instance if we are routing
logs to different queues depending on the severity, we might also
want to differentiate on the origin. A warning log from a critical system
could for instance want to be routed to a queue that normally handles only errors.