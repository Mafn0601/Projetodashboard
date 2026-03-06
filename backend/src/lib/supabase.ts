import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const usingAnonKey = !process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.SUPABASE_ANON_KEY;

let supabaseClient: any = null;

// Só criar cliente se as credenciais estiverem disponíveis
if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    if (usingAnonKey) {
      console.warn('⚠️  Supabase inicializado com ANON KEY. Operações de escrita podem falhar por RLS.');
    }
  } catch (error) {
    console.error('⚠️  Erro ao inicializar Supabase:', error);
  }
} else {
  console.warn('⚠️  Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY).');
}

// Exportar um proxy que valida antes de usar
export const supabase = {
  from: (table: string) => {
    if (!supabaseClient) {
      console.warn(`⚠️  Supabase não configurado. Operação "${table}" não será sincronizada.`);
      const notConfiguredError = {
        message: 'Supabase não configurado no backend',
        details: 'Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
      };
      return {
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
        insert: () => Promise.resolve({ data: null, error: notConfiguredError }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
        select: () => ({ eq: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
      };
    }
    return supabaseClient.from(table);
  },
};

export default supabase;
