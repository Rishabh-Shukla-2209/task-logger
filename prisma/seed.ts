import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));
  
  const pool = new Pool({ connectionString });
  
  // Verify connection and table
  const check = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User'`);
  console.log('User table found:', check.rows.length > 0);

  const users = [
    { username: 'employee1', password: 'password', role: 'EMPLOYEE' },
    { username: 'employee2', password: 'password', role: 'EMPLOYEE' },
    { username: 'employee3', password: 'password', role: 'EMPLOYEE' },
    { username: 'manager1', password: 'password', role: 'MANAGER' },
    { username: 'coordinator1', password: 'password', role: 'COORDINATOR' },
    { username: 'admin1', password: 'password', role: 'ADMIN' },
  ];

  for (const user of users) {
    await pool.query(
      `INSERT INTO public."User" (id, username, password, role, created_at, updated_at) 
       VALUES (gen_random_uuid(), $1, $2, $3::"Role", NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET role = $3::"Role", password = $2`,
      [user.username, user.password, user.role]
    );
  }

  console.log('Database seeded with users:', users.map(u => `${u.username} (${u.role})`).join(', '));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
