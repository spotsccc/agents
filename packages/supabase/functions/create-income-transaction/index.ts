import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const pool = new Pool(Deno.env.get("SUPABASE_DB_URL")!, 1);

import type { CreateIncomeTransactionRequest } from "./contract.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let connection;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Отсутствует заголовок авторизации" }),
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
      return new Response(JSON.stringify({ error: "Неавторизован" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateIncomeTransactionRequest = await req.json();
    const { walletId, amount, currency, sourceId, description } = body;

    connection = await pool.connect();
    await connection.queryArray("BEGIN");

    try {
      // ========================================
      // ИСПОЛЬЗУЕМ SERVICE_ROLE - БЕЗ RLS
      // ========================================

      // Service role обходит RLS, но мы всё равно проверяем владение вручную
      await connection.queryArray("SET LOCAL ROLE service_role");

      // ========================================
      // ВАЛИДАЦИЯ - КРИТИЧНО ДЛЯ БЕЗОПАСНОСТИ!
      // ========================================

      if (amount <= 0) {
        throw new Error(
          `Сумма дохода должна быть положительной, получено: ${amount}`
        );
      }

      // ВАЖНО: Проверяем что кошелёк принадлежит пользователю
      // Это наша защита, т.к. RLS отключен
      const walletCheck = await connection.queryObject(
        `SELECT 1 
         FROM wallets 
         WHERE id = $1 
           AND user_id = $2
           AND deleted_at IS NULL`,
        [walletId, user.id]
      );

      if (walletCheck.rows.length === 0) {
        throw new Error("Кошелёк не найден или не принадлежит пользователю");
      }

      // ВАЖНО: Проверяем что источник дохода принадлежит пользователю
      const sourceCheck = await connection.queryObject(
        `SELECT 1 
         FROM income_sources 
         WHERE id = $1 
           AND user_id = $2
           AND deleted_at IS NULL`,
        [sourceId, user.id]
      );

      if (sourceCheck.rows.length === 0) {
        throw new Error(
          "Источник дохода не найден или не принадлежит пользователю"
        );
      }

      // ========================================
      // ПОЛУЧЕНИЕ И БЛОКИРОВКА БАЛАНСА
      // ========================================

      const balanceResult = await connection.queryObject<{ balance: string }>(
        `SELECT balance 
         FROM wallet_balances
         WHERE wallet_id = $1 
           AND currency_code = $2
         FOR UPDATE`,
        [walletId, currency]
      );

      let currentBalance: number;

      if (balanceResult.rows.length === 0) {
        await connection.queryObject(
          `INSERT INTO wallet_balances (wallet_id, currency_code, balance)
           VALUES ($1, $2, 0)`,
          [walletId, currency]
        );
        currentBalance = 0;
      } else {
        currentBalance = parseFloat(balanceResult.rows[0].balance);
      }

      // ========================================
      // ВЫЧИСЛЕНИЕ НОВОГО БАЛАНСА
      // ========================================

      const newBalance = currentBalance + amount;

      if (newBalance > 999999999999999) {
        throw new Error(
          "Баланс после операции превысит максимально допустимое значение"
        );
      }

      // ========================================
      // СОЗДАНИЕ ТРАНЗАКЦИИ
      // ========================================

      const currentDate = new Date().toISOString().split("T")[0];

      const transactionResult = await connection.queryObject<{ id: string }>(
        `INSERT INTO transactions (
          user_id,
          type,
          description,
          date,
          created_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id`,
        [user.id, "income", description, currentDate]
      );

      const transactionId = transactionResult.rows[0].id;

      // ========================================
      // СОЗДАНИЕ ENTRY
      // ========================================

      const entryResult = await connection.queryObject<{ id: string }>(
        `INSERT INTO transaction_entries (
          transaction_id,
          wallet_id,
          currency_code,
          amount,
          balance_after,
          source_id,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id`,
        [transactionId, walletId, currency, amount, newBalance, sourceId]
      );

      const entryId = entryResult.rows[0].id;

      // ========================================
      // ОБНОВЛЕНИЕ БАЛАНСА
      // ========================================

      await connection.queryObject(
        `UPDATE wallet_balances
         SET 
           balance = $1,
           updated_at = NOW()
         WHERE wallet_id = $2 
           AND currency_code = $3`,
        [newBalance, walletId, currency]
      );

      await connection.queryArray("COMMIT");

      return new Response(
        JSON.stringify({
          transaction_id: transactionId,
          entry_id: entryId,
          previous_balance: currentBalance,
          new_balance: newBalance,
          currency: currency,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      await connection.queryArray("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Ошибка при создании транзакции дохода:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Внутренняя ошибка сервера",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
