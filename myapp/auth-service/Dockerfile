FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose application port
EXPOSE 4000

# Run the application
CMD ["node", "dist/server.js"]