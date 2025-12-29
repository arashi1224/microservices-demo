FROM node:18-alpine AS base

FROM base AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

FROM base

WORKDIR /usr/src/app

# Copy dependencies from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Create protos directory
RUN mkdir -p protos

COPY protos/demo.proto ./protos/

# Copy source code
COPY *.js ./
COPY users.json ./

# Install grpc health probe
RUN GRPC_HEALTH_PROBE_VERSION=v0.4.19 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# Expose port
EXPOSE 9080

# Start the service
CMD ["node", "scheduler.js"]