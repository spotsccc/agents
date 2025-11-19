import type {Database} from "@/shared/supabase/types.ts";

export type Currency = Database['public']['Tables']['currencies']['Row']
