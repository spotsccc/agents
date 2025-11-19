import type {Database} from "@/shared/supabase/types.ts";

export type Task = Database['public']['Tables']['tasks']['Row']
