FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Start the service
CMD ["node", "src/index.js"]

