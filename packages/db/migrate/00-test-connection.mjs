import pg from 'pg';
import mysql from 'mysql2/promise';
import { env } from './_env.mjs';

const { Client } = pg;

console.log('== Probando Supabase (DIRECT_URL, pooler session :5432) ==');
const pgc = new Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
try {
  await pgc.connect();
  const r = await pgc.query('select version(), current_database(), current_user');
  console.log('OK Postgres:', r.rows[0].version.split(',')[0]);
  console.log('   db/user:', r.rows[0].current_database, '/', r.rows[0].current_user);
  await pgc.end();
} catch (e) {
  console.error('FALLO Postgres:', e.message);
}

console.log('\n== Probando MariaDB origen (MYSQL_SOURCE_URL) ==');
try {
  const my = await mysql.createConnection(env.MYSQL_SOURCE_URL);
  const [rows] = await my.query('select version() as v, database() as d');
  console.log('OK MariaDB:', rows[0].v, '/ db:', rows[0].d);
  await my.end();
} catch (e) {
  console.error('FALLO MariaDB:', e.message);
}
