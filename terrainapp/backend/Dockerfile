# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Expose the port your app runs on
EXPOSE 6969

# Command to run the application
CMD ["npm", "start"]
