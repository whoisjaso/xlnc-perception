import postgres from 'postgres';

async function testRegions() {
  const password = 'Adekunle12!';
  const projectRef = 'ztzxiuhieisrjwnrrkky';

  // All possible Supabase regions
  const regions = [
    'aws-0-us-east-1',
    'aws-0-us-east-2',
    'aws-0-us-west-1',
    'aws-0-us-west-2',
    'aws-0-eu-west-1',
    'aws-0-eu-west-2',
    'aws-0-eu-west-3',
    'aws-0-eu-central-1',
    'aws-0-ap-southeast-1',
    'aws-0-ap-southeast-2',
    'aws-0-ap-northeast-1',
    'aws-0-ap-south-1',
    'aws-0-sa-east-1',
  ];

  console.log('Testing all Supabase regions...\n');

  for (const region of regions) {
    const url = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${region}.pooler.supabase.com:6543/postgres`;

    process.stdout.write(`${region}: `);

    try {
      const sql = postgres(url, {
        connect_timeout: 8,
        idle_timeout: 3,
        max: 1,
      });

      await sql`SELECT 1`;
      console.log('✅ SUCCESS!');
      await sql.end();

      // Update .env with working connection
      console.log('\n==========================================');
      console.log('✅ FOUND WORKING REGION:', region);
      console.log('\nUpdate DATABASE_URL in .env to:');
      console.log(`DATABASE_URL=${url}`);
      console.log('==========================================');
      process.exit(0);
    } catch (error: any) {
      if (error.message?.includes('Tenant')) {
        console.log('❌ Tenant not found');
      } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
        console.log('❌ Timeout');
      } else {
        console.log('❌', error.message?.substring(0, 40));
      }
    }
  }

  console.log('\n❌ No working region found');
  process.exit(1);
}

testRegions();
