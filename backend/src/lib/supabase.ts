import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

// Só criar cliente se as credenciais estiverem disponíveis
if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('⚠️  Erro ao inicializar Supabase:', error);
  }
} else {
  console.warn('⚠️  Supabase não configurado. Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas.');
}

// Exportar um proxy que valida antes de usar
export const supabase = {
  from: (table: string) => {
    if (!supabaseClient) {
      console.warn(`⚠️  Supabase não configurado. Operação "${table}" não será sincronizada.`);
      return {
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        select: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      };
    }
    return supabaseClient.from(table);
  },
};

export default supabase;
