- [Instructions for examiner](#instructions-for-examiner)
- [Description](#description)
  - [Implemented project requirements](#implemented-project-requirements)
- [Getting started](#getting-started)
  - [Requirements](#requirements)
  - [Running the project](#running-the-project)
  - [Project structure](#project-structure)
  - [Development](#development)
    - [Non Docker Development](#non-docker-development)
    - [Docker based development](#docker-based-development)
    - [Testing](#testing)
      - [Example runs](#example-runs)
- [Deployment](#deployment)
  - [Steps of deploying to Heroku container service for multiple images](#steps-of-deploying-to-heroku-container-service-for-multiple-images)
- [Learnings and reflection](#learnings-and-reflection)
- [Amount of effort](#amount-of-effort)
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
- [TODO](#todo)

# Instructions for examiner


# Description
*Original project outline can be found in the attached assignment.pdf document*

The goal of this solo-developed project is to implement a service which utilizes RabbitMQ to communicate messages between worker threads with two REST API ends points which control the state of the system and return information from it.
The application is running on Heroku and is backed by a CI/CD pipeline
running on a local instance of Gitlab.

Component-wise breakdown:

**ORIG**
- Sends messages on a loop 3 seconds apart in topic my.o
- Possible messages sent by the service include
  - MSG_1
  - MSG_2
  - MSG_3
- Service can be in states
  - PAUSED - messages stop sending
  - RUNNING - messages start sending again
  - SHUTDOWN - in dev stops sending messages, in production container is scaled down
  - INIT - container is starting up, will start delivering messages when started. State automatically set to RUNNING

**IMED(Intermediate)**
- Subscribes for messages from my.o (sent by orig)
- Publishes message to my.i
- Possible message combinations include (depending on orig input)
  - Got MSG_1
  - Got MSG_2
  - Got MSG_3
- Service can be in states
  - SHUTDOWN - messages are no longer received
  - INIT - messages can be received again
  
**OBSE(Observer)**
- Subscribes for all messages within the network, therefore receiving from both my.o and my.i
- Stores the messages into a file
- Examples of possible messages saved by the service include
  - 2020-11-01T06:35:01.373Z MSG_1
  - 2020-11-01T06:36:02.373Z GOT MSG_1 
    - Timestamps are ISO typestamps
    - All IMED and ORIG message types are covered in similar fashion
- Service can be in states
  - SHUTDOWN - messages are no longer received
  - INIT - messages can be received again

**HTTPSERV**
- When requested, returns content of the file created by OBSE
- Service can be in states
  - SHUTDOWN - REST API is not responsive
  - INIT - REST API is up
- On local development the service is accessible via `http://localhost:8082`
  - 8082 was set as the port so as to not conflict with local Gitlab runtime

**APIGATEWAY**
- Implements an API service to control IMED, ORIG and OBSE workers and HTTPSERV api
- Communicates with ORIG via special control messages
- Service can be only in RUNNING state, because otherwise it could not INIT other services. In effect it is always on and serves as the main gateway to the service
  - RUNNING - can send commands to other services and query them
  
**Gitlab**
- The repository includes a local Gitlab runtime, which can be found outside vh4 folder in root `./gitlab-ci`
- You can start the service with `docker-compose up --build` in it's folder
- You can register a runtime for test execution by running `gitlab-runner-register.sh` executable
- Information on how to setup multiple git remotes can be found in section [Working with multiple git remotes](#working-with-multiple-git-remotes)
- Adding authentication and working with git in general is assumed to be common knowledge and not outlined here
- The deployment and testing procedures are outlined in repository root at `gitlab-ci.yml`
- In order to deploy to Heroku you need to define `HEROKU_API_KEY` in the Gitlab CI/CD settings and this key should be requested separately from the maintainer

## Implemented project requirements
Requirements are outlined in the assignment document and project root

- [x] Install the pipeline infrastructure using gitlab-ci
- [x] Create, setup and test an automatic testing framework
- [x] Implements changes to the system by using the pipeline. The development should be done in test-driven manner. Further notes on this in section [Testing](#testing)
- [x] implement a static analysis step in the pipeline by using tools like jlint, pylint or SonarQube. This is implemented with Eslint in repository root.
- [x] Deploy the application at least to your own machine. Done via deployment to Heroku container service, outlined in detail in section [Deployment](#deployment)
- [ ] Implement monitoring and logging for troubleshooting. Not implemented because of time limitations. However services log to console which is accessible via `heroku logs --tail -a application-name`
- [x] Provide an end report. This is available in repository root (not project root) with the name `EndReport.pdf`, which is effectively an export of this Markdown file.

# Getting started

## Requirements

- [Docker runtime](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) if you want to deploy manually and not through the CI/CD pipeline. Note that this requires authentication that can be requested from the maintainer
- [Yarn](https://yarnpkg.com/getting-started)
- A browser, Curl, Postman or similar for communicating with the service
- An internet connection :)

## Running the project

`docker-compose up --build`

Once the service is healthy, it can start receiving messages. Once apigateway is up, methods
can be called. The service will automatically be set to RUNNING mode and messages will be sent.

*You can put the service in SHUTDOWN state with*
`curl -X PUT localhost:8081/state?payload=SHUTDOWN`

*You can put the service in INIT state with*
`curl -X PUT localhost:8081/state?payload=INIT`

*You can put the service in PAUSE state with*
`curl -X PUT localhost:8081/state?payload=PAUSE`

*You can put the service in RUNNING state with*
`curl -X PUT localhost:8081/state?payload=SHUTDOWN`

*You can get the state of the service with*
`curl localhost:8081/state`

*You can get a timestamped log of state changes with*
`curl localhost:8081/run-log`

*You can get a log of messages sent (and stored by obse) with*
`curl localhost:8081/messages`

**Note that SHUTDOWN will clear messages sent and stored by the service!**

## Project structure

The project is split into self contained micro services with their of package.json and dependency management. Each is it's own container and deployed to a separate
Heroku instance. Local development is orchestrated via docker-compose

This way they can change independently from each other. This is a bit inconvenient because we need to run yarn or npm install separately in each package. However this is not needed when development happens in the Docker environment.

- project root includes assigment.pdf which includes detailed instructions on the project and our docker-compose config file
- Each aforementioned module is listed under source with their own package.json, env, README and so on
- static code analysis is done via Eslint which is shared from repository root

In addition to services mentioned in the description, there are two additional utility packages:

**rabbitmq-helpers**
- Implements a queue wrapper to send and consume both fanout and topic based messages
- This package is found in `./src/rabbitmq` and is published as a public npm module
- You can create updates to the service in the folder and distribute them via `npm publish`. In versioning we follow the [Semver](https://semver.org/) convention.

**s3**
- Implements methods to upload, get and delete files from S3
- This service is circumvented in local and local docker development via using the filesystem to remove unnecessary network requests
- As of writing the service does not include unit tests but it has been tested extensively in practice. Nevertheless unit tests should be added in the future.

## Development


### Non Docker Development

If you want to develop individual serices, you need to initialize rabbitmq service separately with `docker run -d -p 15672:15672 -p 5672:5672 rabbitmq:3-management`
after which you can access it on the browser at `localhost:15672` with password and username = guest

You should be able to run each service via it's start script after a yarn install
and have them communicate with each other. However a combined startup is not orchestrated yet, so a recommended method would be to use our docker-compose
for development

### Docker based development

As mentioned earlier you can run the project with `docker-compose up --build` in project root (project, not repository). This will spin up all necessary services and set them in RUNNING mode.

A big gotcha at the time of writing is that there is no code hot-reload into the container, so in order for your changes to reflect to the runtime you need
to do another docker build. Current workflow around this is to develop the services
separately outside docker environment and then integration test them with docker-compose


### Testing

Each package uses [mocha](https://mochajs.org/) as it's test runner [sinon](https://sinonjs.org/) for test spies, stubs and mock and [expect](https://www.npmjs.com/package/expect) for test result assertion. In some cases sinon assertions are used such as for spies. Tests were placed in each package separately for easier test 
management and separation of concerns. This is against requirement 3
`Tests mush be in a separate folder “tests” at the root of your folder tree.`
but the decision was made for ease of development and because it will
not affect any functional requirements. This can be updated separately if this 
is a hard requirement, but it will make path resolution more confusing and make
test discoverability harder.

The main focus of this project so far has been to have wide coverage on unit tests,
which are writted for each module following the [Test-driven Development](https://en.wikipedia.org/wiki/Test-driven_development) principles. Additional integration
tests could, and should, be added in the future. However this was removed as a goal
because of time limitations, but will be improved upon later. 

#### Example runs

# Deployment

This service is deployed to [Heroku](https://www.heroku.com/deploy-with-docker) automatically in our Gitlab CI/CD pipeline using separate containers for each service and using their CLI for deployment.

Heroku was chosen because of it's relatively easy setup and a free tier that
just supports the 5 apps required to run this project. However there are special considerations which are not outlined in Heroku's documentation clearly

First of all we are dealing with a multi container deployment which is more difficult
than the basic one container deployment which is outlined in most guidelines. For instance in [Heroku's documentation](https://devcenter.heroku.com/articles/container-registry-and-runtime) this is only briefly discussed and discussed a bit more in detail in this [article](https://devcenter.heroku.com/articles/container-registry-and-runtime#pushing-multiple-images)

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

# Amount of effort

The total amount of effort on this project stacked up to 65 hours


# Notes on docker

## Up & Down

```
docker-compose up --build -d
```
*remove -d if you want to see logs from the instances*

when you want to take the service run in root

```
docker-compose down
```

## On volumes

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

## Useful commands 

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

## Sources

https://stackoverflow.com/questions/31746182/docker-compose-wait-for-container-x-before-starting-y
https://stackoverflow.com/questions/47710767/what-is-the-alternative-to-condition-form-of-depends-on-in-docker-compose-versio
https://stackoverflow.com/questions/57065750/docker-compose-volume-overrides-copy-in-multi-stage-build
https://docs.docker.com/config/containers/start-containers-automatically/#use-a-restart-policy
https://docs.docker.com/engine/reference/commandline/container_prune/


# RabbitMQ

RabbitMQ is one of the most popular open source message brokers including message queuing, topic based
communication with included support for data safety. 
It is used by small to large enterprises, it is highly performant, scalable, lightweight and easy to deploy both on premises and to the cloud.

## Publisher
Sends messages to an exchange or directly to a queue

## Consumer
Initializes a named or unnamed queue which receives either direct messages
from a producer or messages matching the subscribed topic from an exchange

## Queue
a client can be part of a queue and receive messages from it.

## Receiving messages
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

## Sending messages
You can send a message to a queue with
```js
const options = {
    persistent:true // The message will survive broker restarts provided it’s in a queue that also survives restarts.
  }
channel.sendToQueue(queue,Buffer.from(message),options)
```

## Publishing a message
You can publish a message in an exchange with.
```js
channel.publish('exchange-name','', Buffer.from('something to do'))
```
instead of the empty string, you can define a routing key to deliver the message
only to queues that are subscribed to the route

## Exchange
a queue can be part of an exchange, the exchange can be in different modes.

### Fanout
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

### Direct
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

## Topic

Sometimes a simple route is not enough, for instance if we are routing
logs to different queues depending on the severity, we might also
want to differentiate on the origin. A warning log from a critical system
could for instance want to be routed to a queue that normally handles only errors.

## Sources

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

  
# TODO
- [ ] And hot code reloading to all scripts
- [ ] Consider using Lerna monorepo with Yarn Workspaces and changing the modules to be published as NPM packages
- [ ] Write unit tests for S3 service
- [ ] Add integration tests