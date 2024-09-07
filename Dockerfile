# Use an official Node.js runtime as the base image
FROM node:20-alpine as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code to the working directory
COPY . .

# Build the app
RUN npm run build

# Use nginx as the base image for serving static files
FROM nginx:alpine

# Copy the generated static files from the build stage to the nginx default public directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for incoming traffic
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]