import type {Database} from "@/shared/supabase/types.ts";

export type Category = Omit<Database['public']['Tables']['categories']['Row'], 'user_id'>;
