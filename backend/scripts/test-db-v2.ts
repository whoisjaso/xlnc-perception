import postgres from 'postgres';

async function testConnections() {
  const password = 'Adekunle12!';
  const projectRef = 'ztzxiuhieisrjwnrrkky';

  // Updated connection formats based on newer Supabase
  const connections = [
    {
      name: 'Direct IPv4 (Port 5432)',
      url: `postgresql://postgres:${encodeURIComponent(password)}@${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Direct IPv6 (Port 5432)',
      url: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Pooler Supavisor (Port 6543)',
      url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'Pooler Session Mode (Port 5432)',
      url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    },
    {
      name: 'New Format - Pooler with Project Subdomain',
      url: `postgresql://postgres:${encodeURIComponent(password)}@${projectRef}.pooler.supabase.com:6543/postgres`,
    },
    {
      name: 'New Format - Direct Supabase.co',
      url: `postgres://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    },
  ];

  for (const conn of connections) {
    console.log(`\n[${conn.name}]`);
    console.log('URL:', conn.url.replace(encodeURIComponent(password), '***'));

    try {
      const sql = postgres(conn.url, {
        connect_timeout: 15,
        idle_timeout: 5,
        max: 1,
      });

      const result = await sql`SELECT current_database(), current_user`;
      console.log('✅ SUCCESS! DB:', result[0].current_database, 'User:', result[0].current_user);
      await sql.end();

      console.log('\n==========================================');
      console.log('✅ WORKING CONNECTION STRING:');
      console.log(conn.url);
      console.log('==========================================');
      process.exit(0);
    } catch (error: any) {
      console.log('❌', error.message?.substring(0, 80));
    }
  }

  console.log('\n❌ All connection methods failed');
  console.log('\nPlease copy the EXACT connection string from:');
  console.log('Supabase Dashboard → Settings → Database → Connection string → URI');
  process.exit(1);
}

testConnections();
