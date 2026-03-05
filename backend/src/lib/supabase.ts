import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase não configurado. Algumas operações podem não sincronizar.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
