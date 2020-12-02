# Description
These functions provide an abstraction layer for initializing rabbitMQ producers and consumers, it:

- Implements a queue wrapper to send and consume both fanout and topic based messages
- You can create updates to the service in the folder and distribute them via `npm publish`. In versioning we follow the [Semver](https://semver.org/) convention.