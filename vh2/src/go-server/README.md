# General

This Go server serves one route at root / and responds with a JSON body
containing a structure of

```json
"remoteAddress":"ip:port"
"localAddress":"ip:port"
```
here remoteAddress is the callee's address and port and localAddress is the servers address and port.
Note that inside the container because of network mapping inside docker-compose the ip address
of go will be just "go"

When running with docker compose, this service is only accessible via local network, such as calling from
the related node server

## Running the project

go run server.go

# Docker

## Build

docker build --tag go-test-1 .

## Access build image

docker run --rm -it go-test-1 /bin/ash


## Notes on the image

### As command

FROM alpine:latest as builder
RUN apk --no-cache add build-base

FROM builder as build1
COPY source1.cpp source.cpp
RUN g++ -o /binary source.cpp


### COPY --from
The COPY --from=0 line copies just the built artifact from the previous stage into this new stage. The Go SDK and any intermediate artifacts are left behind, and not saved in the final image


### Exec vs run

Simply speaking “docker run” has its target as docker images and “docker exec” is targeting pre-existing docker containers. Using the resources inside images or container are of different sense. When using “docker run” a temporary docker container is created  and stopped(not terminated) after the command has finished running. “Docker exec” needs a running container to take the command.

### Entrypoint vs CMD

https://goinbigdata.com/docker-run-vs-cmd-vs-entrypoint/#:~:text=ENTRYPOINT%20instruction%20allows%20you%20to,runs%20with%20command%20line%20parameters.

### Entrypoint

ENTRYPOINT instruction allows you to configure a container that will run as an executable. It looks similar to CMD, because it also allows you to specify a command with parameters. The difference is ENTRYPOINT command and parameters are not ignored when Docker container runs with command line parameters. (There is a way to ignore ENTTRYPOINT, but it is unlikely that you will do it.)

ENTRYPOINT has two forms:

ENTRYPOINT ["executable", "param1", "param2"] (exec form, preferred)
ENTRYPOINT command param1 param2 (shell form)
Be very careful when choosing ENTRYPOINT form, because forms behaviour differs significantly.


### CMD

CMD sets default command and/or parameters, which can be overwritten from command line when docker container runs.