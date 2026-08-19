# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built artifacts from the build stage
COPY --from=build /app/dist/pharmacy-store/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
