import type { ColumnType } from "kysely";
import type { Database } from "./index.ts";

/**
 * Convert Supabase table type to Kysely table type.
 */
type SupabaseTableToKysely<
  T extends { Row: object; Insert: object; Update: object },
> = {
  [K in keyof T["Row"]]: ColumnType<
    T["Row"][K],
    K extends keyof T["Insert"] ? T["Insert"][K] : never,
    K extends keyof T["Update"] ? T["Update"][K] : never
  >;
};

/**
 * Fully automatic Kysely database type from Supabase schema.
 *
 * - No manual table listing
 * - Auto-updates when you run `supabase gen types`
 * - All tables from public schema included automatically
 */
export type KyselyDatabase = {
  [TableName in keyof Database["public"]["Tables"]]: SupabaseTableToKysely<
    Database["public"]["Tables"][TableName]
  >;
};
