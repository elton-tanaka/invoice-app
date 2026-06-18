import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: new URL(process.env.DATABASE_URL!).searchParams.has('sslmode')
      ? process.env.DATABASE_URL!
      : `${process.env.DATABASE_URL!}${process.env.DATABASE_URL!.includes('?') ? '&' : '?'}sslmode=verify-full`,
  },
  verbose: true,
  strict: true,
});