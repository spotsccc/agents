import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://mjnbydawpuhhrbwsqqkd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbmJ5ZGF3cHVoaHJid3NxcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjkxODEsImV4cCI6MjA2OTE0NTE4MX0.S05a6H-V9X2-yHHYYkHrJdqxFuxbiR3tplZwzNSUFdw";

export const supabase = createClient(supabaseUrl, supabaseKey);
