/**
 * Migration: Convert all FILED cases to SUMMONED
 * This removes the redundant FILED status from the system
 */

import { pool } from '../db.js';

async function migrateFiled ToSummoned() {
  try {
    console.log('Starting migration: FILED -> SUMMONED');
    
    // Update all cases with FILED status to SUMMONED
    const [result] = await pool.query(`
      UPDATE cases 
      SET status = 'SUMMONED' 
      WHERE status = 'FILED'
    `);
    
    console.log(`✅ Migration complete: ${result.affectedRows} cases updated from FILED to SUMMONED`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateFiledToSummoned()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
