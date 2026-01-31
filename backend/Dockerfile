# Build stage
FROM node:20-alpine AS builder

# Cache bust
ARG CACHEBUST=1

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

# Build backend (includes Prisma generate)
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

# Copy Prisma schema, config, and migrations for runtime
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/prisma.config.ts ./backend/

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg

# Copy Prisma binary for migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

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

WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server (run migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
# Build 1738389600
