# General




## Running the project

### Development
Run rabbitMQ
`docker run -d -p 15672:15672 -p 5672:5672 --name rabbit-test-for-medium rabbitmq:3-management`


```
docker-compose up --build -d
```
*remove -d if you want to see logs from the instances*

when you want to take the service run in root

```
docker-compose down
```

## Usage


## Project structure


## RabbitMQ

https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
http://www.squaremobius.net/amqp.node/channel_api.html#channel

### Publisher

### Consumer

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

## NOTEs

You can ssh into a running container with exect
https://phase2.github.io/devtools/common-tasks/ssh-into-a-container/