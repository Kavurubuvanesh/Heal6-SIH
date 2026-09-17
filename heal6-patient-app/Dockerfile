# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing Docker layer cache)
COPY package*.json ./
RUN npm ci || npm install

# Copy application source code and build production bundle
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Nginx Server
# ==========================================
FROM nginx:1.25-alpine AS runner

# Remove default Nginx welcome site
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Deploy custom production Nginx configuration with Wasm MIME & Cross-Origin Isolation
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Production Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/health || exit 1

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
