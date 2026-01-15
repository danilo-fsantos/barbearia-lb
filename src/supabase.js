import { createClient } from '@supabase/supabase-js'

// Pega as chaves que configuramos no arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseKey)