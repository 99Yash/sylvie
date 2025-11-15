# Docker Setup Guide

This guide explains how to use Docker with the Sylvie project for both development and production.

## Quick Start

1. **Create environment file:**

   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   # Or create a .env file in the project root
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root with the following variables:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://sylvie:sylvie@postgres:5432/sylvie
   POSTGRES_USER=sylvie
   POSTGRES_PASSWORD=sylvie
   POSTGRES_DB=sylvie
   POSTGRES_PORT=5432

   # Server Configuration
   PORT=3001
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development

   # Web Configuration
   WEB_PORT=3000
   NEXT_PUBLIC_SERVER_URL=http://localhost:3001

   # Better Auth Configuration (generate secret with: openssl rand -base64 32)
   BETTER_AUTH_SECRET=your-secret-here
   BETTER_AUTH_URL=http://localhost:3001
   FRONTEND_URL=http://localhost:3000

   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

3. **Build and start services:**

   ```bash
   docker-compose up --build
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec server pnpm --filter @sylvie/db db:push
   ```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SERVER_URL`: Public URL of the server (used by web app)
- `CORS_ORIGIN`: Origin allowed for CORS requests
- `PORT`: Server port (default: 3001)

### Optional but Recommended

- `BETTER_AUTH_SECRET`: Secret key for Better Auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: URL of the auth server
- `FRONTEND_URL`: URL of the frontend application
- `NODE_ENV`: Environment mode (development/production)

### OAuth Providers (Optional)

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret

## Development

For development, you can create a `docker-compose.override.yml` file (gitignored) to override settings:

```yaml
version: '3.9'

services:
  server:
    environment:
      - NODE_ENV=development
      - CORS_ORIGIN=http://localhost:3000

  web:
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

## Production

For production, set the following environment variables:

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_SERVER_URL=https://api.yourdomain.com
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@postgres:5432/dbname
```

## Common Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f server

# Stop services
docker-compose down

# Stop services and remove volumes
docker-compose down -v

# Rebuild a specific service
docker-compose build server

# Execute a command in a container
docker-compose exec server pnpm --filter @sylvie/db db:push

# Run database migrations
docker-compose exec server pnpm --filter @sylvie/db db:migrate

# Open database studio
docker-compose exec server pnpm --filter @sylvie/db db:studio
```

## Networking

All services are connected via the `sylvie-network` bridge network:

- **postgres**: Accessible at `postgres:5432` from other containers
- **server**: Exposed on `localhost:3001` (configurable via `PORT`)
- **web**: Exposed on `localhost:3000` (configurable via `WEB_PORT`)

## Troubleshooting

### Database Connection Issues

If you're having database connection issues:

1. Check that postgres is healthy: `docker-compose ps`
2. Verify DATABASE_URL uses `postgres` as the hostname (for container-to-container communication)
3. Check postgres logs: `docker-compose logs postgres`

### Port Conflicts

If ports are already in use, you can change them in your `.env` file:

```env
PORT=3002
WEB_PORT=3001
POSTGRES_PORT=5433
```

### Environment Variables Not Loading

Make sure your `.env` file is in the project root (same directory as `docker-compose.yml`).

### Build Issues

If you encounter build issues:

1. Clean build cache: `docker-compose build --no-cache`
2. Remove old containers: `docker-compose down -v`
3. Rebuild: `docker-compose up --build`

## Production Deployment

For production deployment:

1. Set all required environment variables in your deployment platform
2. Use strong secrets for `BETTER_AUTH_SECRET`
3. Use HTTPS URLs for `CORS_ORIGIN`, `BETTER_AUTH_URL`, and `FRONTEND_URL`
4. Set `NODE_ENV=production`
5. Configure proper database credentials
6. Set up proper reverse proxy (nginx, traefik, etc.) if needed
7. Configure SSL/TLS certificates
8. Set up monitoring and logging
