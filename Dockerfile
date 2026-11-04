# ========================================================
# MyCourse PLMS - Production Multi-Stage Dockerfile
# Optimized for AWS EC2 t3.micro (Ubuntu 24.04 LTS)
# ========================================================

# --------------------------------------------------------
# Stage 1: Build Frontend Assets
# --------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies cleanly
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and production environment configuration
COPY frontend/ ./

# Build production distribution (/app/frontend/dist)
RUN npm run build

# --------------------------------------------------------
# Stage 2: Production Runtime
# --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment flags
ENV NODE_ENV=production \
    PORT=5000

# Install production-only backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

# Copy backend application source code
COPY backend/ ./backend/

# Copy compiled frontend artifacts from Stage 1 into backend/public
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Create dedicated non-root user and setup permissions
RUN addgroup -S appgroup -g 1001 && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /app/backend/uploads && \
    chown -R appuser:appgroup /app

USER appuser
WORKDIR /app/backend

# Expose internal Express port
EXPOSE 5000

# Container health check against production endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Express server
CMD ["node", "server.js"]

