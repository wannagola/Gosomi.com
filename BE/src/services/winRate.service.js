import { pool } from '../db.js';

/**
 * Recalculates and updates the win rate for a specific user
 * Formula: (wins / total_cases) * 100
 * @param {number} userId - The ID of the user to update
 */
export async function updateUserWinRate(userId) {
  try {
    // Get all COMPLETED cases for this user
    const [cases] = await pool.query(
      `SELECT id, plaintiff_id, defendant_id, fault_ratio FROM cases 
       WHERE (plaintiff_id = ? OR defendant_id = ?) AND status = 'COMPLETED'`,
      [userId, userId]
    );

    const totalCases = cases.length;
    
    if (totalCases === 0) {
      // No completed cases, keep default 50%
      await pool.query(
        'UPDATE users SET win_rate = 50.00 WHERE id = ?',
        [userId]
      );
      return 50.00;
    }

    let wins = 0;

    cases.forEach(c => {
      let ratios;
      try {
        ratios = typeof c.fault_ratio === 'string' ? JSON.parse(c.fault_ratio) : c.fault_ratio;
      } catch (e) {
        return; // Skip if parsing fails
      }

      if (!ratios) return;

      const pFault = Number(ratios.plaintiff || 0);
      const dFault = Number(ratios.defendant || 0);
      const isPlaintiff = Number(c.plaintiff_id) === Number(userId);

      if (isPlaintiff) {
        // Plaintiff wins if defendant has more fault
        if (dFault > pFault) wins++;
      } else {
        // Defendant wins if plaintiff has more fault
        if (pFault > dFault) wins++;
      }
    });

    // Calculate win rate: (wins / total) * 100
    const winRate = ((wins / totalCases) * 100).toFixed(2);

    // Update database
    await pool.query(
      'UPDATE users SET win_rate = ? WHERE id = ?',
      [winRate, userId]
    );

    console.log(`✅ Updated win rate for user ${userId}: ${winRate}% (${wins}/${totalCases})`);
    return Number(winRate);

  } catch (error) {
    console.error(`❌ Error updating win rate for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Updates win rates for all users who participated in a case
 * @param {number} caseId - The ID of the completed case
 */
export async function updateWinRatesForCase(caseId) {
  try {
    const [rows] = await pool.query(
      'SELECT plaintiff_id, defendant_id FROM cases WHERE id = ?',
      [caseId]
    );

    if (rows.length === 0) {
      throw new Error(`Case ${caseId} not found`);
    }

    const { plaintiff_id, defendant_id } = rows[0];

    // Update both plaintiff and defendant
    await updateUserWinRate(plaintiff_id);
    await updateUserWinRate(defendant_id);

    console.log(`✅ Updated win rates for case ${caseId}`);
  } catch (error) {
    console.error(`❌ Error updating win rates for case ${caseId}:`, error);
    throw error;
  }
}
