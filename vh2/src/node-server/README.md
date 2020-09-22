# devops

https://medium.com/better-programming/docker-for-node-js-in-production-b9dc0e9e48e0

docker build --tag node-hello-world .


## Running containers
docker ps

## Images 
docker image ls

## Run
docker run <<inser tag name>>

## Interactive alpine run

docker run --rm -it node-hello-world /bin/ash

/bin/ash is Ash (Almquist Shell) provided by BusyBox
--rm Automatically remove the container when it exits (docker run --help)
-i Interactive mode (Keep STDIN open even if not attached)
-t Allocate a pseudo-TTY

## Removing a container

docker container ls to list running
docker container ls -aq to list all
docker container prune to remove all