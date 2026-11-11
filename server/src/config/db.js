import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is missing. Add it to server/.env before using database routes.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});
