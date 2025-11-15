# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build workspace packages
RUN pnpm --filter @sylvie/db build
RUN pnpm --filter @sylvie/api build
RUN pnpm --filter @sylvie/auth build

# Build server
RUN pnpm --filter server build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Copy workspace packages (source needed for exports resolution)
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/config ./packages/config

# Copy server package.json
COPY --from=builder /app/apps/server/package.json ./apps/server/

# Install production dependencies only
# This will properly link workspace packages
RUN pnpm install --frozen-lockfile --prod

# Copy built server (after install to maintain workspace links)
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Set working directory to server
WORKDIR /app/apps/server

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/index.js"]

