
FROM node:24-bookworm-slim

WORKDIR /app

# Install tools needed to compile native Node.js packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install shared package dependencies
COPY packages/common/package*.json ./packages/common/

WORKDIR /app/packages/common
RUN npm ci --omit=dev

# Install Auth Service dependencies
WORKDIR /app
COPY services/auth-service/package*.json ./services/auth-service/

WORKDIR /app/services/auth-service
RUN npm_config_build_from_source=true npm_config_nodedir=/usr/local npm ci --omit=dev --foreground-scripts

# Copy source files, preserving the directory structure
WORKDIR /app
COPY packages/common/src ./packages/common/src
COPY services/auth-service/ ./services/auth-service/

# Run Auth Service from its own directory
WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["npm", "start"]
