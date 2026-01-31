# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all package files for the monorepo
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/backend/dist ./backend/dist

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Environment variables (documented)
# Required:
#   DATABASE_URL - PostgreSQL connection string
#   JWT_SECRET - Secret for JWT signing
# Optional:
#   PORT - Server port (default: 3000)
#   NODE_ENV - Environment (default: production)
#   TWITTER_CLIENT_ID - Twitter OAuth client ID
#   TWITTER_CLIENT_SECRET - Twitter OAuth client secret
#   TWITTER_CALLBACK_URL - Twitter OAuth callback URL

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "backend/dist/main.js"]
