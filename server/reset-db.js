import 'dotenv/config';
import { sql, initDb } from './db.js';

async function resetDatabase() {
  console.log('[DB Reset] Connecting to Neon PostgreSQL...');
  
  try {
    // Drop existing tables in order
    console.log('[DB Reset] Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS meetings CASCADE;`;
    await sql`DROP TABLE IF EXISTS tasks CASCADE;`;
    await sql`DROP TABLE IF EXISTS projects CASCADE;`;
    await sql`DROP TABLE IF EXISTS employees CASCADE;`;
    console.log('[DB Reset] Existing tables dropped.');

    // Re-initialize tables and seed clean default data
    console.log('[DB Reset] Recreating clean schema and seeding default records...');
    await initDb();
    console.log('[DB Reset] ✅ Database successfully reset to clean initial state!');
    process.exit(0);
  } catch (err) {
    console.error('[DB Reset] ❌ Error resetting database:', err);
    process.exit(1);
  }
}

resetDatabase();
