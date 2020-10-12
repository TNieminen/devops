# General

This Node server serves one route at root "/", calls an internal go service and returns
the concatenated network information as a string. 

**NOTE**
This service depends upon a related go-server, so running it directly is not recommended and 
you should prefer docker-compose on which there are further documentation at root README.

The expected response format from this server is:

```
// This is the node servers network, where network address is dependent on your host network setup and content is served via port 8001
Hello from ::ffff:172.23.0.3:8001 

// This is the origin of your request, when you connect to the server at port 8001 an ephemeral request port is selected
// at maximum  2^16–1 (65535) which in this case 44560. This is the address the server sends it's response to
To ::ffff:172.23.0.1:44560 

// Because of Dockers internal network mapping the go-server sees itself simply as go
Hello from go:8080 

// go server is responding to our node server, which is attached to the local network, hence it has a host network address. The port mapping
// is a random ephemeral port is assigned.
To 172.23.0.3:49084   
```

NOTE! Because of the Not recommended, because the functionality of our route depends on an external resource mapped through docker.
See section **Docker** for recommended usage

## Running the project

```
yarn install
yarn start
```

If you wish to use docker, see section **Docker**

## Development practices

This server is being run with nodemon, which means that any changes into the server file
will lead to automatic restart of the server. This behavior is replicated in Docker
with volumes

# Docker

## Build image

docker build --tag node-hello-world .

## See running containers
docker ps

## Images 
docker image ls

## Run
docker run node-hello-world

## Interactive alpine run

docker run --rm -it node-hello-world /bin/ash

--rm Automatically remove the container when it exits (docker run --help)
-i Interactive mode (Keep STDIN open even if not attached)
-t Allocate a pseudo-TTY

## Removing a container

docker container ls to list running
docker container ls -aq to list all
docker container prune to remove all