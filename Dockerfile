# Use lightweight Node.js LTS Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the application source code
COPY . .

# Expose API port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
