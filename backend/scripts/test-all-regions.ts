import postgres from 'postgres';

const password = 'yMckOYSvTqXGQfR4';
const ref = 'ztzxiuhieisrjwnrrkky';

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
  'sa-east-1', 'ca-central-1', 'me-south-1', 'af-south-1'
];

async function test() {
  console.log('Testing all regions with new password...\n');

  for (const r of regions) {
    const url = `postgresql://postgres.${ref}:${password}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
    process.stdout.write(`${r}: `);

    try {
      const sql = postgres(url, { connect_timeout: 8, max: 1 });
      await sql`SELECT 1`;
      console.log('✅ SUCCESS!');
      console.log(`\n✅ Region found: ${r}`);
      console.log(`URL: postgresql://postgres.${ref}:[PASSWORD]@aws-0-${r}.pooler.supabase.com:6543/postgres`);
      await sql.end();
      process.exit(0);
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('Tenant')) console.log('❌ Not found');
      else if (msg.includes('timeout')) console.log('❌ Timeout');
      else console.log('❌ ' + msg.substring(0, 40));
    }
  }

  console.log('\n❌ Project not found in any region');
  console.log('\nThis project may need pooler to be enabled in Supabase settings.');
}

test();
