import postgres from 'postgres';
import env from '../src/config/env';

async function testConnection() {
  const url = env.DATABASE_URL;
  console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':***@'));

  try {
    const sql = postgres(url, {
      connect_timeout: 10,
      idle_timeout: 5,
    });

    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connected successfully!');
    console.log('Result:', result);

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'XX000') {
      console.log('\n⚠️  "Tenant or user not found" typically means:');
      console.log('   1. The Supabase project may have been paused (free tier pauses after inactivity)');
      console.log('   2. The project reference ID may be incorrect');
      console.log('   3. The password may have been changed');
      console.log('\n→ Go to https://supabase.com/dashboard and check your project status');
    }

    process.exit(1);
  }
}

testConnection();
