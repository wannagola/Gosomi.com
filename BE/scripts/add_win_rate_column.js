import { pool } from '../src/db.js';

async function addWinRateColumn() {
  try {
    console.log('Checking if win_rate column exists...');
    
    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'win_rate'
    `);
    
    if (columns.length > 0) {
      console.log('✅ win_rate column already exists');
    } else {
      console.log('Adding win_rate column to users table...');
      
      // Add win_rate column with default value of 50
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN win_rate DECIMAL(5,2) DEFAULT 50.00
      `);
      
      console.log('✅ win_rate column added successfully with default value 50.00');
    }
    
    // Update existing users to have default win_rate if null
    const [result] = await pool.query(`
      UPDATE users 
      SET win_rate = 50.00 
      WHERE win_rate IS NULL
    `);
    
    console.log(`✅ Updated ${result.affectedRows} users to default win_rate of 50%`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding win_rate column:', error);
    process.exit(1);
  }
}

addWinRateColumn();
