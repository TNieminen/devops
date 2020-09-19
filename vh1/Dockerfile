# Use the smallest footprint base image
FROM node:12-alpine
# We do not want to run the app as root for security concerns.
# Alpine image gives us a user node, so let us use that
RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

# Change workdir
WORKDIR /home/node/app

# chown moved packages, remember ./ is now at workdir root
COPY --chown=node:node ./src/* ./

CMD [ "node", "index.js"]