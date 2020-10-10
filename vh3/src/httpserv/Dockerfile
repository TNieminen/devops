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
COPY --chown=node:node ./src/bin/www /home/node/app/bin/
COPY --chown=node:node ./src/index.js /home/node/app/

CMD [ "node", "./src/bin/www"]