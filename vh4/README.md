- [Description](#description)
- [Getting started](#getting-started)
  - [Running the project](#running-the-project)
  - [Project structure](#project-structure)
  - [Development](#development)
- [Learnings and reflection](#learnings-and-reflection)
  - [Notes on docker](#notes-on-docker)
    - [Up & Down](#up--down)
    - [On volumes](#on-volumes)
    - [Useful commands](#useful-commands)
    - [Sources](#sources)
  - [RabbitMQ](#rabbitmq)
    - [Publisher](#publisher)
    - [Consumer](#consumer)
    - [Queue](#queue)
    - [Receiving messages](#receiving-messages)
    - [Sending messages](#sending-messages)
    - [Publishing a message](#publishing-a-message)
    - [Exchange](#exchange)
      - [Fanout](#fanout)
      - [Direct](#direct)
    - [Topic](#topic)
    - [Sources](#sources-1)
- [Working with multiple git remotes](#working-with-multiple-git-remotes)
- [Heroku multi-container deployment](#heroku-multi-container-deployment)
  - [Steps of deploying to Heroku container service for multiple images](#steps-of-deploying-to-heroku-container-service-for-multiple-images)
  - [Notes for implementation](#notes-for-implementation)
- [NEXT UP](#next-up)
- [TODO](#todo)

# Description
*Original project outline can be found in the attached assignment.pdf document*

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


# Getting started

## Running the project

`docker-compose up --build`

you should be able to get the system output served by httpserv module at

`curl localhost:8080`

## Project structure

The project is split into self contained micro services with their of package.json and dependency management.
This way they can change independently from each other. This is a bit inconvenient because we need
to run yarn or npm install separately in each package. However this is not needed when development happens in the Docker
environment.

- Root includes assigment.pdf which includes detailed instructions on the project and our docker-compose config file
- Each aforementioned module is listed under source with their own package.json, env, README and so on

## Development

If you want to develop individual files against rabbit, you can initialize the service separately with
`docker run -d -p 15672:15672 -p 5672:5672 --name rabbit-test-for-medium rabbitmq:3-management`
and access it on the browser at `localhost:15672` with password and username = guest

Using the services is however not supported out of the box without a Docker environment as of now, but
this might be added later


# Learnings and reflection

In my experience topic based queue communication is a great way to improve the robustness and reliability of a system.
For instance what I've used queues for in the past was to ensure that audio buffers were uploaded,
processed and saved in a safe manner. This was important, because this datatype represented a non-repeating,
unique and irreplaceable piece of information. Whereas in a HTTP based system might fail a request and the data
would be lost forever with a queue system (in this case Kue running on Redis) allowed me to 
1. Make sure that the queue system received the message, and re-send if necessary.
2. Make sure that the items don't get lost via redundancy of queues and data replication in case of a redis service crash
3. Make sure that items are removed from the queue only after the item has been marked completed
In addition most queue systems allow to set both timed events and TTL events, where an event would be fired at, or after
some time, and where an item might have a specific time to be consumed before it was removed from the queue or possibly
moved to a separate dead-letter queue for later manual or automatic processing. None of these features are baked in HTTP based communication.

What sets RabbitMQ apart for Redis, or for instance AWS SQS, is it's topic based communication, which makes it easy
to consume the same events in multiple places and also multiple times if necessary. In addition the documentation
and getting started guides of the software are excellent. However even with this, if I had to pick a queue system
I would go for SQS in the future, this is because rabbitMQ need to be managed by you, or you have to pay someone to manage it.
At this point when you are paying for a service SQS will be a cheaper option. If you decide to self-host, you need
to start worrying about redundancy and clustering of the service, which is a pain of itself. In addition
some traditional limitations of SQS, such as no FIFO support have been [solved already](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html).

As a takeaway RabbitMQ does everything what a queue system needs to do and does it well. However for most uses cases
it seems that a better option would be to opt for a hosted service like SQS.



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

**List available things**
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


**Kill all running containers**
docker container kill $(docker ps -q)

### Sources

https://stackoverflow.com/questions/31746182/docker-compose-wait-for-container-x-before-starting-y
https://stackoverflow.com/questions/47710767/what-is-the-alternative-to-condition-form-of-depends-on-in-docker-compose-versio
https://stackoverflow.com/questions/57065750/docker-compose-volume-overrides-copy-in-multi-stage-build
https://docs.docker.com/config/containers/start-containers-automatically/#use-a-restart-policy
https://docs.docker.com/engine/reference/commandline/container_prune/


## RabbitMQ

RabbitMQ is one of the most popular open source message brokers including message queuing, topic based
communication with included support for data safety. 
It is used by small to large enterprises, it is highly performant, scalable, lightweight and easy to deploy both on premises and to the cloud.

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

### Sources

https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
http://www.squaremobius.net/amqp.node/channel_api.html#channel

# Working with multiple git remotes

**Adding a remote**
```sh
# git remote add REMOTE-ID REMOTE-URL
# A common practice is to name the primary remote as origin

# Add remote 1: GitHub.
git remote add origin git@github.com:jigarius/toggl2redmine.git
# Add remote 2: BitBucket.
git remote add upstream git@bitbucket.org:jigarius/toggl2redmine.git
```

**List all remotes**
```sh
git remote -v
```

**Remove a remote**
```sh
# git remote remove REMOTE-ID
git remote remove upstream
```
**Change url of an existing remote**
```sh
# The syntax is: git remote set-url REMOTE-ID REMOTE-URL
git remote set-url upstream git@foobar.com:jigarius/toggl2redmine.git
```

**Push to single remote**
```sh
# git push REMOTE-ID
git push upstream
```

**Push to multiple remotes**

```sh
# Create a new remote called "all" with the URL of the primary repo.
git remote add all git@github.com:jigarius/toggl2redmine.git
# Re-register the remote as a push URL.
git remote set-url --add --push all git@github.com:jigarius/toggl2redmine.git
# Add a push URL to a remote. This means that "git push" will also push to this git URL.
git remote set-url --add --push all git@bitbucket.org:jigarius/toggl2redmine.git
```

# Heroku multi-container deployment

This [article](https://devcenter.heroku.com/articles/container-registry-and-runtime#pushing-multiple-images) is great resource
on the topic.

However it leaves out two important details:
1. Your app doesn't necessarily have an instance running automatically and you need to run:
`heroku ps:scale your-instance=1 -a your-app-name`
2. The container app will still only have one entrypoint and everything else has to be a worker instance! In our case we have one web instance (httpserv) and other instances are just workers in the background
3. On free tier you can have only one containers running on one instance, hence here we split httpserv and obse into one app and then orig and imed into one app
4. In order for the entrypoint to work, you need to define it as service type web, and in the multi-container mode you need to name the Dockerfile as Dockerfile.web. In the beginning I was using Dockerfile.httpserv and then wondered why I was getting error `H14 error in heroku - “no web processes running”`, mind you, this same error happens also if you have no instances running as outlined in point 1

Details on the process model [here](heroku container:push web -a devops-apigateway)

## Steps of deploying to Heroku container service for multiple images
1. You need an app to run against `heroku create`
2. You need some images, they needs to be nested in sub directories as Dockerfile.servicename
notice that the service managing HTTP calls needs to be called Dockerfile.web to work
3. You push images to heroku with `heroku container:push --recursive -a your-created-app-name`, this will build the images a push them
4. You can always push new changes after doing changes to the files, if there are no changes no new image is uploaded
4.1 You can also defined specifically what you want to push as `heroku container:push --recursive orig imed -a devops-imed-orig`
    which will push Dockerfile.imed and Dockerfile.orig
5. You can then release containers with `heroku container:release web otherservice other2service -a your-created-app`

## Notes for implementation
- Since both httpserv and api service need to be online and heroku only allows one external connection per instance we'll deploy these on separate instances and they can communicate via http.
  - I could even just split each instance to their own dyno so we  can scale them independently. Either use heroku API or drop down to bash and use Heroku CLI https://devcenter.heroku.com/articles/platform-api-reference
- Communication between API gateway and the rest of the services will be done via RabbitMQ
- wanted to use Dockerfile.* type deploys with heroku container --recursive mode, but since we have to have two overlapping API services we can't do that, hence we need to cd to each subdir and do a normal deploy against a local Dockerfile
- Testing
  - Split APi implementation into parts, similar to what you have in the Calculator repo
  - Unit testing
    - https://medium.com/@xoor/building-a-node-js-rest-api-8-unit-testing-822c32a587df
    - https://sinonjs.org/how-to/stub-dependency/
    - Use an interceptor for http calls https://www.npmjs.com/package/nock such as the fetch to httpserv
    - https://sinonjs.org/releases/latest/mocks/
    - https://medium.com/@oyetoketoby80/how-to-write-unit-test-for-your-rest-api-f8f71376273f
    - It seems that what is seen as unit testing is really integration testing most of the time, maybe I could seek to do first unit tests for methods and then integration tests on top?
  
# NEXT UP
- [ ] Merge PR in TDD way
- [ ] Update env inconsistencies for obse 
- [ ] Add tests
- [ ] Add shutdown and init methods for production
- [ ] Write test report
- [ ] 
# TODO
- [ ] And hot code reloading to all scripts
- [ ] Allow development without a Docker environment
- [ ] Consider using Lerna monorepo and changing the modules to be published as NPM packages