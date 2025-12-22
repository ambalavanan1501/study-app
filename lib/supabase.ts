import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://mwcrfoncpeuunvxcizbd.supabase.co';
const supabaseAnonKey = 'sb_publishable_CxukFjxBL6DoTkyrORLRgw_CAGRnQ7d';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
