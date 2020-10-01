# General

This project implements a simple Docker backed ip ping service which returns
the requesters and services' ip and port mappings. The service
consists of two parts.

A node server, which is public to the network served at localhost:8001
this service has one route at root "/"

A go server, which is not public and only accessible through the Docker network.
In this repository it is accessed by the public node-server

For further information see part **Usage**


## Running the project

```
docker-compose up --build -d
```
*remove -d if you want to see logs from the instances*

when you want to take the service run in root

```
docker-compose down
```

## Usage

After running the project, you can access the service with

```sh
curl localhost:8001
```

or you can access the service directly from your browser at
`localhost:8001`


The expected response format (without the comments) is:

NOTE:
below ::ffff: is a subnet prefix for IPv4 (32 bit) addresses that are placed inside an IPv6 (128 bit) space. IPv6 is broken into two parts, the subnet prefix, and the interface suffix. Each one is 64 bits long, or, 4 groups of 4 hexadecimal characters.

```
// This is the node servers network, where network address is dependent on your host network setup and content is served via port 8001

> Hello from ::ffff:172.23.0.3:8001 

// This is the origin of your request, when you connect to the server at port 8001 an ephemeral request port is selected
// at maximum  2^16–1 (65535) which in this case 44560. This is the address the server sends it's response to

> To ::ffff:172.23.0.1:44560 

// Because of Dockers internal network mapping the go-server sees itself simply as go

> Hello from go:8080 

// go server is responding to our node server, which is attached to the local network, hence it has a host network address. The port mapping
// is a random ephemeral port is assigned.

> To 172.23.0.3:49084   
```


## Project structure

All related files are served under `./src`
There are two services included
`./src/node-server`
and
`./src/go-server`
for further information see their respective README.md files
