# Backend API Dockerfile
FROM node:18-alpine

# Install build dependencies for native modules and curl for health check
RUN apk add --no-cache python3 make g++ sqlite-dev curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules for Alpine Linux
RUN npm ci --only=production && npm rebuild sqlite3

# Copy source code
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Start the application
CMD ["npm", "start"]
