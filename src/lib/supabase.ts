import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umpiasberurevfctywqv.supabase.co';
const supabaseAnonKey = 'sb_publishable_pCHFJ83v40aLkRNXipu3CA_OMkR4PYW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
