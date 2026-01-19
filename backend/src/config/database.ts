import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import env from './env';
import * as schema from '../db/schema/users';

// Create PostgreSQL connection
const connectionString = env.DATABASE_URL;

// For querying
const queryClient = postgres(connectionString);

// Initialize Drizzle ORM
export const db = drizzle(queryClient, { schema });

// Test connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await queryClient`SELECT 1`;
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};
