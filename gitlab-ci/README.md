# Description

There are multiple ways and instructions on how to install gitlab-ci. Our recommendation is to use
dockerized approach as described in https://gitlab.com/gitlab-org/gitlab-foss/issues/50851 . There
you can find two files:

1. Docker-compose.yml to start gitlab and runner
2. Shell-script to register the runner with gitlab

- [x]  Install gitlab and runners on their own machine
- [ ]  Define pipeline using gitlab-ci.yaml. The result should be a running system so a `git push` should result in the system being up and running
- [ ]  Test the pipeline with current version of the application

## CI/CD

CI/CD yml file definition reference is available [here](https://docs.gitlab.com/ee/ci/yaml/)