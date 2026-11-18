
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

# Install Product Service dependencies
WORKDIR /app
COPY services/product-service/package*.json ./services/product-service/

WORKDIR /app/services/product-service
RUN npm_config_build_from_source=true npm_config_nodedir=/usr/local npm ci --omit=dev --foreground-scripts

# Copy source files
WORKDIR /app
COPY packages/common/src ./packages/common/src
COPY services/product-service/ ./services/product-service/

# Run Product Service
WORKDIR /app/services/product-service

EXPOSE 3003

CMD ["npm", "start"]
