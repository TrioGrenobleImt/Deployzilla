FROM node:20-slim

# Install curl and pnpm
RUN apt-get update && apt-get install -y curl && npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose server port
EXPOSE 3000

# Start server in development mode
CMD ["pnpm", "dev"]
