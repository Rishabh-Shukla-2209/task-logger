const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const targetId = '00d3cbbf-d56f-4dd2-9e03-930f8143be0c';
  
  try {
    const res = await pool.query(
      `UPDATE "CallContact" SET "data_owner_id" = $1 WHERE "data_owner_id" IS NULL`,
      [targetId]
    );
    console.log(`Updated ${res.rowCount} CallContact records.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
