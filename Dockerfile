# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Allocate 4GB memory for Vite bundler
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy custom Nginx configuration with SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
