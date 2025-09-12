# Use a Node.js image for our development environment.
FROM node:20-alpine

# Set the working directory inside the container.
WORKDIR /app

# Copy the package.json and package-lock.json to the container.
# We do this first to leverage Docker's caching, so dependencies don't have to be re-installed every time the code changes.
COPY package*.json ./

# Install all development and production dependencies in a single step.
RUN npm install

# Copy all the project files into the container.
COPY . .
# Expose the Vite development server port.
EXPOSE 5173

CMD ["npm", "run", "dev"]