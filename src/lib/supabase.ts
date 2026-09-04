import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = Boolean(url && key);
export const supabase: SupabaseClient | null = supabaseEnabled ? createClient(url!, key!) : null;

// Thin write-through sync. The local store is the source of truth for the UI;
// when Supabase is configured every mutation is mirrored to the matching table.
// Tables are defined in supabase/migrations/0001_nova_wheels.sql.
export async function mirror(table: string, row: Record<string, unknown>) {
  if (!supabase) return;
  try {
    await supabase.from(table).upsert(row, { onConflict: 'id' });
  } catch (e) {
    console.warn(`[supabase] mirror ${table} failed`, e);
  }
}

export async function mirrorDelete(table: string, id: string) {
  if (!supabase) return;
  try {
    await supabase.from(table).delete().eq('id', id);
  } catch (e) {
    console.warn(`[supabase] delete ${table} failed`, e);
  }
}

export async function pull<T>(table: string): Promise<T[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.warn(`[supabase] pull ${table} failed`, error.message);
    return null;
  }
  return (data ?? []) as T[];
}

/** Insert-only write (used where anonymous visitors may only insert, e.g. reservations). */
export async function insertRow(table: string, row: Record<string, unknown>) {
  if (!supabase) return;
  try {
    await supabase.from(table).insert(row);
  } catch (e) {
    console.warn(`[supabase] insert ${table} failed`, e);
  }
}
