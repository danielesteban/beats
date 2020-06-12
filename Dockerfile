FROM node:erbium

ENV NODE_ENV production

# Create working directory
RUN mkdir -p /usr/src/beats
WORKDIR /usr/src/beats

# Install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm ci

# Copy server & client
COPY server/ server/
COPY client/ client/

# De-escalate privileges
USER node

# Start server
CMD [ "node", "server/main.js" ]
