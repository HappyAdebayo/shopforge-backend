
FROM node:24-bookworm-slim

WORKDIR /app

# Install tools needed to compile native Node.js packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Compile native dependencies inside this container
RUN npm_config_build_from_source=true npm ci --omit=dev

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
