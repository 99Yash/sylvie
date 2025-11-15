import { db } from '@sylvie/db';
import * as schema from '@sylvie/db/schema/auth';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

// Validate BETTER_AUTH_SECRET before creating auth instance
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      `BETTER_AUTH_SECRET is required in production but is missing or empty. ` +
        `This will cause authentication to fail or be vulnerable. ` +
        `Generate a secure value with: openssl rand -base64 32`
    );
  }
  if (secret.length < 32) {
    console.warn(
      `⚠️  WARNING: BETTER_AUTH_SECRET is shorter than 32 characters. ` +
        `For better security, use a longer secret (at least 32 characters). ` +
        `Generate with: openssl rand -base64 32`
    );
  }
} else {
  // Development: warn but don't fail
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.trim() === '') {
    console.warn(
      `⚠️  WARNING: BETTER_AUTH_SECRET is not set in development. ` +
        `Authentication may not work correctly. ` +
        `Generate with: openssl rand -base64 32`
    );
  }
}

// Server-side auth instance (used in the backend auth server)
// This instance has direct database access and handles authentication
export const auth = betterAuth<BetterAuthOptions>({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ''],
  emailAndPassword: {
    enabled: true,
  },
  telemetry: {
    debug: process.env.NODE_ENV === 'development',
  },
  socialProviders: {
    google: {
      display: 'popup',
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  advanced: {
    cookiePrefix: 'sylvie__',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
});

// Auth client for Next.js Server Components/API routes
// This makes HTTP calls to the auth server instead of connecting to the database
export function createAuthServerClient(baseURL: string) {
  return betterAuth({
    baseURL,
  });
}
