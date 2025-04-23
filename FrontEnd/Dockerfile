FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Copy env file for Docker
COPY .env.docker .env

# Expose port for the app
EXPOSE 3000

# Use development mode for better debugging
CMD ["npm", "run", "dev", "--", "--host"]