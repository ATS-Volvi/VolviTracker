import 'dotenv/config';
import { sql, initDb } from './db.js';

async function resetDatabase() {
  console.log('[DB Reset] Connecting to Neon PostgreSQL...');
  
  try {
    console.log('[DB Reset] Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS document_vault CASCADE;`;
    await sql`DROP TABLE IF EXISTS master_directory CASCADE;`;
    await sql`DROP TABLE IF EXISTS cash_transactions CASCADE;`;
    await sql`DROP TABLE IF EXISTS cash_accounts CASCADE;`;
    await sql`DROP TABLE IF EXISTS payments_made CASCADE;`;
    await sql`DROP TABLE IF EXISTS payments_received CASCADE;`;
    await sql`DROP TABLE IF EXISTS supplier_pos CASCADE;`;
    await sql`DROP TABLE IF EXISTS invoices CASCADE;`;
    await sql`DROP TABLE IF EXISTS client_pos CASCADE;`;
    await sql`DROP TABLE IF EXISTS finance_projects CASCADE;`;
    await sql`DROP TABLE IF EXISTS exchange_rates CASCADE;`;
    await sql`DROP TABLE IF EXISTS docs CASCADE;`;
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
