# Use the smallest footprint base image
FROM node:12-alpine
# We do not want to run the app as root for security concerns.
# Alpine image gives us a user node, so let us use that
RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

# Change workdir
WORKDIR /home/node/app

# Separate dependency installation from executable code for build performance
COPY --chown=node:node package.json yarn.lock /home/node/app/
# Don't generate a lockfile on install, this makes certain that we have static
# dependency resolving
RUN yarn install --frozen-lockfile

# chown moved packages, remember ./ is now at workdir root
COPY --chown=node:node ./.env.defaults /home/node/app/
COPY --chown=node:node ./.mocharc.js /home/node/app/
COPY --chown=node:node ./src/ /home/node/app/src/

# Add a volume where data would be shared, this is used in docker-compose
# between this service and obse
VOLUME /home/node/data/

# https://we-are.bookmyshow.com/understanding-expose-in-dockerfile-266938b6a33d
EXPOSE 8082

CMD [ "node", "./src/bin/www"]


# A VOLUME instruction in the dockerfile creates a mount point but initially only maps it to Docker's internal data directory.
# In order to map the volume to the host filesystem, you need to specify which path on the host should be mapped to the volume.
# You can do this in the docker-compose file using the volumes parameter. (Note: you can create volumes using docker-compose without
# declaring them in the Dockerfile.) Note that when mapping a directory from the host to a container, the
# directory contents on the host will replace the contents in the container, not vice versa.