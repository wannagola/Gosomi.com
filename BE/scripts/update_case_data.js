
import { pool } from "../src/db.js";

async function main() {
  try {
    // Update Case 8 with realistic data
    // Assuming lawType was '1' (which caused the issue before, maybe map it to 'time' or 'friendship')
    // Actually, I'll update law_type to 'time' as well to fix the icon properly.
    
    await pool.query(`
      UPDATE cases 
      SET 
        title = '약속 시간 1시간 늦고 사과도 대충 함',
        content = '지난 주 토요일 강남역에서 보기로 했는데, 아무 연락 없이 1시간이나 늦게 나타났습니다. \n\n늦은 이유를 물어보니 "늦잠 잤다"고만 하고 밥도 안 사고 그냥 넘어가려고 했습니다. \n\n제 시간은 소중하지 않은 건가요? 이에 대해 공식적인 사과와 보상을 청구합니다.',
        law_type = 'time'
      WHERE id = 8 OR case_number = '2026-GOSOMI-008'
    `);
    
    console.log("Case 8 updated with realistic data.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
