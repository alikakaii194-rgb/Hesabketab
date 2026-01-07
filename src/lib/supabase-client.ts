import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if the environment variables are set. If not, throw a detailed error.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key are required. \n' +
    'Please create a .env.local file in the root of your project and add the following lines:\n\n' +
    'NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"\n' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"\n\n' +
    'You can find these values in your Supabase project settings under "API".'
  );
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
