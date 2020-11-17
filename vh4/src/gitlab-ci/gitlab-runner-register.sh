#!/bin/sh
# Get the registration token from:
# http://localhost:8080/root/${project}/settings/ci_cd
# Runner documenation
# https://docs.gitlab.com/runner/

registration_token=qAjsSQpg6HVMgVsxGmAi

docker exec -it gitlab-runner1 \
  gitlab-runner register \
  --non-interactive \
  --registration-token ${registration_token} \
  --locked=false \
  --description docker-stable \
  --url http://gitlab-web \
  --executor docker \
  --docker-image debian:stable-slim \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode gitlab-network

# docker:stable
