// filepath: c:\Users\garbs\LitShelf\src\supabase.ts
import { createClient } from '@supabase/supabase-js';

// Obtém a URL e a chave Anon das variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verifica se as variáveis foram carregadas corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);