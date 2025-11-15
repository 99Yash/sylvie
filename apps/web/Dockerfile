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
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build workspace packages (if needed for web)
RUN pnpm --filter @sylvie/db build
RUN pnpm --filter @sylvie/api build
RUN pnpm --filter @sylvie/auth build

# Set build-time environment variables
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Build Next.js app
RUN pnpm --filter web build

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
COPY apps/web/package.json ./apps/web/

# Copy workspace packages (full packages needed for Next.js resolution)
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/config ./packages/config

# Copy web app package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Install production dependencies
# This will properly link workspace packages
RUN pnpm install --frozen-lockfile --prod

# Copy web app build and source (after install to maintain workspace links)
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/src ./apps/web/src

# Set working directory
WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Start Next.js (explicitly bind to 0.0.0.0 for Docker)
CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]

