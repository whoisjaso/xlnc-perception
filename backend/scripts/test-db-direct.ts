import postgres from 'postgres';

async function testConnections() {
  const password = 'Adekunle12!';
  const projectRef = 'ztzxiuhieisrjwnrrkky';

  // Different connection formats to try
  const connections = [
    {
      name: 'Direct Connection',
      url: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    },
    {
      name: 'Session Pooler (Port 5432)',
      url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    },
    {
      name: 'Transaction Pooler (Port 6543)',
      url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    },
  ];

  for (const conn of connections) {
    console.log(`\nTesting: ${conn.name}`);
    console.log('URL:', conn.url.replace(encodeURIComponent(password), '***'));

    try {
      const sql = postgres(conn.url, {
        connect_timeout: 10,
        idle_timeout: 5,
        max: 1,
      });

      const result = await sql`SELECT 1 as test`;
      console.log('✅ SUCCESS!');
      await sql.end();

      console.log('\n========================================');
      console.log('USE THIS CONNECTION STRING:');
      console.log(conn.url.replace(encodeURIComponent(password), '***'));
      console.log('========================================');
      return conn.url;
    } catch (error: any) {
      console.log('❌ Failed:', error.message);
    }
  }

  console.log('\n❌ All connection methods failed');
  return null;
}

testConnections();
