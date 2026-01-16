import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import { createClient } from "supabase";

import type { CreateExpenseTransactionRequest } from "./contract.ts";
import type { KyselyDatabase } from "../../scheme/kysely.ts";

const pool = new Pool({
  connectionString: Deno.env.get("SUPABASE_DB_URL"),
  max: 1,
});

const db = new Kysely<KyselyDatabase>({
  dialect: new PostgresDialect({ pool }),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (!user || authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateExpenseTransactionRequest = await req.json();
    const { walletId, amount, currency, categoryId, description } = body;

    // Validation
    if (amount <= 0) {
      throw new Error(`Expense amount must be positive, got: ${amount}`);
    }

    // Execute in transaction
    const result = await db.transaction().execute(async (trx) => {
      // Set service role to bypass RLS
      await sql`SET LOCAL ROLE service_role`.execute(trx);

      // Validate wallet ownership
      const walletCheck = await trx
        .selectFrom("wallets")
        .select("id")
        .where("id", "=", walletId)
        .where("user_id", "=", user.id)
        .where("deleted_at", "is", null)
        .limit(1)
        .execute();

      if (walletCheck.length === 0) {
        throw new Error("Wallet not found or does not belong to user");
      }

      // Validate category ownership
      const categoryCheck = await trx
        .selectFrom("categories")
        .select("id")
        .where("id", "=", categoryId)
        .where("user_id", "=", user.id)
        .limit(1)
        .execute();

      if (categoryCheck.length === 0) {
        throw new Error("Category not found or does not belong to user");
      }

      // Get wallet balance with lock
      const balanceResult = await sql<{ balance: number }>`
        SELECT balance FROM wallet_balances
        WHERE wallet_id = ${walletId} AND currency_code = ${currency}
        FOR UPDATE
      `.execute(trx);

      let currentBalance: number;

      if (balanceResult.rows.length === 0) {
        // No balance record exists - create one with 0
        await trx
          .insertInto("wallet_balances")
          .values({
            wallet_id: walletId,
            currency_code: currency,
            balance: 0,
          })
          .execute();
        currentBalance = 0;
      } else {
        currentBalance = Number(balanceResult.rows[0].balance);
      }

      // Check sufficient funds
      if (currentBalance < amount) {
        throw new Error(
          `Insufficient funds. Current balance: ${currentBalance}, requested: ${amount}`
        );
      }

      // Calculate new balance
      const newBalance = currentBalance - amount;

      // Create transaction
      const currentDate = new Date().toISOString().split("T")[0];

      const newTransaction = await trx
        .insertInto("transactions")
        .values({
          user_id: user.id,
          type: "expense",
          description,
          date: currentDate,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Create entry (amount stored as negative for expenses)
      const newEntry = await trx
        .insertInto("transaction_entries")
        .values({
          transaction_id: newTransaction.id,
          wallet_id: walletId,
          currency_code: currency,
          amount: -amount,
          balance_after: newBalance,
          category_id: categoryId,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Update balance
      await trx
        .updateTable("wallet_balances")
        .set({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .where("wallet_id", "=", walletId)
        .where("currency_code", "=", currency)
        .execute();

      return {
        transactionId: newTransaction.id,
        entryId: newEntry.id,
        previousBalance: currentBalance,
        newBalance,
      };
    });

    return new Response(
      JSON.stringify({
        transaction_id: result.transactionId,
        entry_id: result.entryId,
        previous_balance: result.previousBalance,
        new_balance: result.newBalance,
        currency,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating expense transaction:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
