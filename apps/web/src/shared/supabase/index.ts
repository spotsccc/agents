import { createClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "supabase/scheme";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Wallet types
export type Wallet = Tables<"wallets">;
export type InsertWallet = TablesInsert<"wallets">;

// Transaction types
export type Transaction = Tables<"transactions"> & {
  entries: Tables<"transaction_entries">[];
};
