import dotenv from 'dotenv';

dotenv.config({
  path: '../../apps/server/.env',
});

import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL || '');
export * from 'drizzle-orm';
export * from './schema/index';
