import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import { createClient } from "supabase";

import type { CreateExchangeTransactionRequest } from "./contract.ts";
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

    const body: CreateExchangeTransactionRequest = await req.json();
    const { walletId, fromCurrency, toCurrency, fromAmount, toAmount, description } = body;

    // Validation
    if (fromAmount <= 0) {
      throw new Error(`From amount must be positive, got: ${fromAmount}`);
    }

    if (toAmount <= 0) {
      throw new Error(`To amount must be positive, got: ${toAmount}`);
    }

    if (fromCurrency === toCurrency) {
      throw new Error("Cannot exchange between the same currency");
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

      // Get source currency balance with lock
      const fromBalanceResult = await sql<{ balance: number }>`
        SELECT balance FROM wallet_balances
        WHERE wallet_id = ${walletId} AND currency_code = ${fromCurrency}
        FOR UPDATE
      `.execute(trx);

      let fromCurrentBalance: number;

      if (fromBalanceResult.rows.length === 0) {
        // No balance record exists - create one with 0
        await trx
          .insertInto("wallet_balances")
          .values({
            wallet_id: walletId,
            currency_code: fromCurrency,
            balance: 0,
          })
          .execute();
        fromCurrentBalance = 0;
      } else {
        fromCurrentBalance = Number(fromBalanceResult.rows[0].balance);
      }

      // Check sufficient funds
      if (fromCurrentBalance < fromAmount) {
        throw new Error(
          `Insufficient funds. Current balance: ${fromCurrentBalance} ${fromCurrency}, requested: ${fromAmount}`
        );
      }

      // Get target currency balance with lock
      const toBalanceResult = await sql<{ balance: number }>`
        SELECT balance FROM wallet_balances
        WHERE wallet_id = ${walletId} AND currency_code = ${toCurrency}
        FOR UPDATE
      `.execute(trx);

      let toCurrentBalance: number;

      if (toBalanceResult.rows.length === 0) {
        // No balance record exists - create one with 0
        await trx
          .insertInto("wallet_balances")
          .values({
            wallet_id: walletId,
            currency_code: toCurrency,
            balance: 0,
          })
          .execute();
        toCurrentBalance = 0;
      } else {
        toCurrentBalance = Number(toBalanceResult.rows[0].balance);
      }

      // Calculate new balances
      const fromNewBalance = fromCurrentBalance - fromAmount;
      const toNewBalance = toCurrentBalance + toAmount;

      // Validate max balance
      const MAX_BALANCE = 999999999999999;
      if (toNewBalance > MAX_BALANCE) {
        throw new Error(`Exchange would exceed maximum balance for ${toCurrency}`);
      }

      // Create transaction
      const currentDate = new Date().toISOString().split("T")[0];

      const newTransaction = await trx
        .insertInto("transactions")
        .values({
          user_id: user.id,
          type: "exchange",
          description,
          date: currentDate,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Create debit entry (source currency - negative amount)
      const debitEntry = await trx
        .insertInto("transaction_entries")
        .values({
          transaction_id: newTransaction.id,
          wallet_id: walletId,
          currency_code: fromCurrency,
          amount: -fromAmount,
          balance_after: fromNewBalance,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Create credit entry (target currency - positive amount)
      const creditEntry = await trx
        .insertInto("transaction_entries")
        .values({
          transaction_id: newTransaction.id,
          wallet_id: walletId,
          currency_code: toCurrency,
          amount: toAmount,
          balance_after: toNewBalance,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      // Update source currency balance
      await trx
        .updateTable("wallet_balances")
        .set({
          balance: fromNewBalance,
          updated_at: new Date().toISOString(),
        })
        .where("wallet_id", "=", walletId)
        .where("currency_code", "=", fromCurrency)
        .execute();

      // Update target currency balance
      await trx
        .updateTable("wallet_balances")
        .set({
          balance: toNewBalance,
          updated_at: new Date().toISOString(),
        })
        .where("wallet_id", "=", walletId)
        .where("currency_code", "=", toCurrency)
        .execute();

      return {
        transactionId: newTransaction.id,
        debitEntryId: debitEntry.id,
        creditEntryId: creditEntry.id,
        fromPreviousBalance: fromCurrentBalance,
        fromNewBalance,
        toPreviousBalance: toCurrentBalance,
        toNewBalance,
      };
    });

    return new Response(
      JSON.stringify({
        transaction_id: result.transactionId,
        debit_entry_id: result.debitEntryId,
        credit_entry_id: result.creditEntryId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_previous_balance: result.fromPreviousBalance,
        from_new_balance: result.fromNewBalance,
        to_previous_balance: result.toPreviousBalance,
        to_new_balance: result.toNewBalance,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating exchange transaction:", error);

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
