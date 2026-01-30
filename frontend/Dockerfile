# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY frontend ./frontend

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build Next.js app with standalone output
WORKDIR /app/frontend

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy standalone build
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Environment variables
# Required at build time:
#   NEXT_PUBLIC_API_URL - Backend API URL
# Optional at runtime:
#   PORT - Server port (default: 3000)
#   HOSTNAME - Server hostname (default: 0.0.0.0)

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
