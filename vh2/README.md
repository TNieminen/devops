# Context

For managing and orchestrating cloud system, Docker Compose is a key technology.

For more info see https://docs.docker.com/compose/

The purpose of this exercise is to learn basics of Docker Compose through hands on.

The points from this exercise depend on timing and content:

maximum 4 points are given (total of the course will be about 50)
missing the deadline: points reduced by 0.5 points / day
how well the requirements are met: 2p
following the good programming and docker practicese: 2p

More info in the "assignment.pdf"

## Notes

General notes
https://stackoverflow.com/questions/41322541/rebuild-docker-container-on-file-changes

Dev environment
https://vsupalov.com/rebuilding-docker-image-development/


## Running the project
docker-compose -f ./docker-compose.yml up --build -d


## Networking in docker compose

```yml
version: '3.2'
services:
  # Because node and go are in the same network, go can reach 
  # node at http://node:por-number and the other way around
  go:
    build: ./src/go-server
    image: go-server
    links:
      - "node:node-pinger" # You can now reach node also at node-pinger inside go
    ports:
      - 8080:8080
    networks:
      - ping-network
  node:
    build: ./src/node-server
    image: node-server
    ports:
      - 8081:8081
    # depends_on:
      # - postgres
    networks:
      - ping-network
    # environment:
    # volumes:
networks:
  ping-network:

# volumes:
```

### Network Drivers

[**bridge**](https://docs.docker.com/network/bridge/)
 - Default network driver
 - Usually needed when applications run in standalone containers that need to communicate (in the same network)
 - Provides isolation from containers which are not connected to that bridge network

**host**
 - For standalone containers, remove network isolation between the container and the Docker host, and use the host’s networking directly

**overlay**

**macvlan**

**none**


**network plugins**