import postgres from 'postgres';

const password = 'yMckOYSvTqXGQfR4';
const ref = 'ztzxiuhieisrjwnrrkky';

// Different username formats Supabase might use
const formats = [
  { name: 'postgres.ref', user: `postgres.${ref}` },
  { name: 'ref.postgres', user: `${ref}.postgres` },
  { name: 'postgres', user: 'postgres' },
  { name: 'postgres:ref', user: `postgres:${ref}` },
];

const hosts = [
  'aws-0-us-east-1.pooler.supabase.com:6543',
  'aws-0-us-east-1.pooler.supabase.com:5432',
  `${ref}.pooler.supabase.com:6543`,
  `pooler-${ref}.supabase.co:6543`,
];

async function test() {
  console.log('Testing username/host combinations...\n');

  for (const host of hosts) {
    for (const fmt of formats) {
      const url = `postgresql://${fmt.user}:${password}@${host}/postgres`;
      process.stdout.write(`${fmt.name} @ ${host.substring(0,30)}: `);

      try {
        const sql = postgres(url, { connect_timeout: 5, max: 1 });
        await sql`SELECT 1`;
        console.log('✅ SUCCESS!');
        console.log(`\nWorking: ${url.replace(password, '[PWD]')}`);
        await sql.end();
        process.exit(0);
      } catch (e: any) {
        const msg = e.message || '';
        if (msg.includes('Tenant')) process.stdout.write('tenant ');
        else if (msg.includes('ENOTFOUND')) process.stdout.write('dns ');
        else if (msg.includes('password')) process.stdout.write('auth ');
        else process.stdout.write(msg.substring(0, 10) + ' ');
        console.log('❌');
      }
    }
  }
  console.log('\n❌ No working combination found');
}

test();
