# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
