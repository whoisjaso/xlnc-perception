import postgres from 'postgres';

async function test() {
  const password = 'yMckOYSvTqXGQfR4';
  const projectRef = 'ztzxiuhieisrjwnrrkky';

  const connections = [
    {
      name: 'Direct Connection',
      url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Pooler (Transaction Mode)',
      url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'Pooler (Session Mode)',
      url: `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    },
  ];

  for (const conn of connections) {
    console.log(`\n${conn.name}:`);
    try {
      const sql = postgres(conn.url, { connect_timeout: 10, max: 1 });
      await sql`SELECT 1`;
      console.log('✅ SUCCESS!');
      console.log('\nWorking URL:', conn.url.replace(password, '[PASSWORD]'));
      await sql.end();
      process.exit(0);
    } catch (e: any) {
      console.log('❌', e.message?.substring(0, 60));
    }
  }
  process.exit(1);
}
test();
