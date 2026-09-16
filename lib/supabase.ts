import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://etbpegfmewztcoqtzhnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YnBlZ2ZtZXd6dGNvcXR6aG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjkxMzUsImV4cCI6MjEwMzI0NTEzNX0.EjGFfV9CZPpy-QAxtBaKDHHQK7yV7qAWsI7LF_TZx0k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
