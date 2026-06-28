import { createClient } from '@supabase/supabase-js';

// 自動讀取 Cloudflare Pages 注入的環境變數
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 建立並匯出 Supabase 核心客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
