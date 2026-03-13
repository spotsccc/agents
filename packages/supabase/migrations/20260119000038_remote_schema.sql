

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."transaction_entry_input" AS (
	"wallet_id" "uuid",
	"currency_code" "text",
	"amount" numeric(38,18)
);


ALTER TYPE "public"."transaction_entry_input" OWNER TO "postgres";


CREATE TYPE "public"."transaction_kind" AS ENUM (
    'expense',
    'income',
    'transfer',
    'exchange'
);


ALTER TYPE "public"."transaction_kind" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text" DEFAULT NULL::"text", "p_date" timestamp with time zone DEFAULT "now"()) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
  v_transaction_id UUID;
  v_entry_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- ========================================
  -- ШАГ 1: ВАЛИДАЦИЯ ВХОДНЫХ ПАРАМЕТРОВ
  -- ========================================
  
  -- Проверяем, что сумма положительная
  -- Это важная бизнес-проверка: доход не может быть отрицательным или нулевым
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Сумма дохода должна быть положительной, получено: %', p_amount
    USING ERRCODE = 'P0004',
          HINT = 'Проверьте корректность введённой суммы';
  END IF;
  
  -- Проверяем, что кошелёк существует и принадлежит пользователю
  -- Это критичная проверка безопасности: пользователь не должен иметь возможность
  -- пополнять чужие кошельки
  IF NOT EXISTS (
    SELECT 1 
    FROM wallets 
    WHERE id = p_wallet_id 
      AND user_id = p_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Кошелёк не найден или не принадлежит пользователю'
    USING ERRCODE = 'P0002',
          HINT = 'Проверьте ID кошелька и права доступа';
  END IF;
  
  -- Проверяем, что источник дохода существует и принадлежит пользователю
  -- Это предотвращает ситуацию, когда кто-то пытается использовать
  -- источник дохода другого пользователя
  IF NOT EXISTS (
    SELECT 1 
    FROM income_sources 
    WHERE id = p_source_id 
      AND user_id = p_user_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Источник дохода не найден или не принадлежит пользователю'
    USING ERRCODE = 'P0005',
          HINT = 'Проверьте ID источника дохода';
  END IF;
  
  -- ========================================
  -- ШАГ 2: ПОЛУЧЕНИЕ И БЛОКИРОВКА БАЛАНСА
  -- ========================================
  
  -- Получаем текущий баланс кошелька для указанной валюты
  -- FOR UPDATE критически важен здесь: он блокирует строку баланса,
  -- предотвращая параллельное изменение баланса другими транзакциями.
  -- Без этой блокировки могла бы возникнуть ситуация:
  -- - Транзакция A читает баланс: 1000
  -- - Транзакция B читает баланс: 1000
  -- - Транзакция A добавляет 100, записывает 1100
  -- - Транзакция B добавляет 200, записывает 1200
  -- - Итого: вместо 1300 получаем 1200, потеряли 100!
  SELECT balance INTO v_current_balance
  FROM wallet_balances
  WHERE wallet_id = p_wallet_id 
    AND currency_code = p_currency
  FOR UPDATE;
  
  -- Если баланс для этой валюты ещё не существует, создаём его с нулевым значением
  -- Это может произойти, если пользователь впервые получает доход в этой валюте
  -- в данном кошельке. Например, у него был только рублёвый кошелёк,
  -- а теперь он получил доход в долларах
  IF v_current_balance IS NULL THEN
    INSERT INTO wallet_balances (wallet_id, currency_code, balance)
    VALUES (p_wallet_id, p_currency, 0)
    RETURNING balance INTO v_current_balance;
    
    -- После создания записи v_current_balance будет 0
    -- Строка автоматически заблокирована нашей транзакцией
  END IF;
  
  -- ========================================
  -- ШАГ 3: ВЫЧИСЛЕНИЕ НОВОГО БАЛАНСА
  -- ========================================
  
  -- Для дохода просто добавляем сумму к текущему балансу
  -- Это отличается от расхода, где мы вычитаем, и от перевода,
  -- где логика более сложная
  v_new_balance := v_current_balance + p_amount;
  
  -- Дополнительная проверка на переполнение
  -- NUMERIC в PostgreSQL может хранить очень большие числа,
  -- но всё равно имеет ограничения. Проверяем, что новый баланс
  -- не превышает разумные пределы
  IF v_new_balance > 999999999999999 THEN
    RAISE EXCEPTION 'Баланс после операции превысит максимально допустимое значение'
    USING ERRCODE = 'P0006',
          HINT = 'Возможно, произошла ошибка в расчётах или попытка мошенничества';
  END IF;
  
  -- ========================================
  -- ШАГ 4: СОЗДАНИЕ ЗАПИСИ ТРАНЗАКЦИИ
  -- ========================================
  
  -- Создаём основную запись транзакции
  -- Эта таблица хранит общую информацию о финансовой операции:
  -- кто создал, какого типа, когда произошла
  INSERT INTO transactions (
    user_id,
    type,
    description,
    date,
    created_at
  )
  VALUES (
    p_user_id,
    'income',  -- Явно указываем тип как income
    p_description,
    p_date,    -- Дата когда реально произошёл доход (может отличаться от created_at)
    NOW()      -- Когда запись была создана в базе данных
  )
  RETURNING id INTO v_transaction_id;
  
  -- RETURNING id INTO позволяет нам сразу получить автоматически
  -- сгенерированный ID новой транзакции, который понадобится
  -- для создания связанной записи в transaction_entries
  
  -- ========================================
  -- ШАГ 5: СОЗДАНИЕ ЗАПИСИ ДВИЖЕНИЯ СРЕДСТВ
  -- ========================================
  
  -- Создаём запись в transaction_entries, которая представляет
  -- конкретное движение денег в конкретном кошельке
  -- Одна транзакция может иметь несколько entries (например, при переводе),
  -- но для дохода всегда одна entry
  INSERT INTO transaction_entries (
    transaction_id,
    wallet_id,
    currency_code,
    amount,
    balance_after,
    source_id,
    created_at
  )
  VALUES (
    v_transaction_id,      -- Связываем с транзакцией, созданной на шаге 4
    p_wallet_id,
    p_currency,
    p_amount,              -- Для дохода сумма положительная (в отличие от расхода)
    v_new_balance,         -- Снэпшот баланса после этой операции
    p_source_id,           -- Ссылка на источник дохода (зарплата, фриланс и т.д.)
    NOW()
  )
  RETURNING id INTO v_entry_id;
  
  -- Поле balance_after служит нескольким целям:
  -- 1. Аудит: можно проверить правильность вычислений в любой момент времени
  -- 2. Быстрый доступ: можно мгновенно узнать баланс на любую дату,
  --    просто найдя последнюю entry до этой даты
  -- 3. Отладка: если баланс "поплыл", можно найти где именно,
  --    сравнив balance_after между последовательными entries
  
  -- ========================================
  -- ШАГ 6: ОБНОВЛЕНИЕ ТЕКУЩЕГО БАЛАНСА
  -- ========================================
  
  -- Обновляем актуальный баланс кошелька
  -- Эта таблица wallet_balances хранит "последнее известное состояние"
  -- для быстрого доступа, чтобы не пересчитывать баланс каждый раз
  -- по всей истории транзакций
  UPDATE wallet_balances
  SET 
    balance = v_new_balance,
    updated_at = NOW()
  WHERE wallet_id = p_wallet_id 
    AND currency_code = p_currency;
  
  -- Эта строка всё ещё заблокирована нашим SELECT FOR UPDATE,
  -- поэтому никто другой не может её изменить параллельно
  
  -- ========================================
  -- ШАГ 7: ВОЗВРАТ РЕЗУЛЬТАТА
  -- ========================================
  
  -- Возвращаем JSON объект с информацией о созданной транзакции
  -- Это позволяет клиентскому коду сразу получить всю нужную информацию
  -- без дополнительных запросов к базе данных
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'entry_id', v_entry_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'currency', p_currency,
    'timestamp', NOW()
  );
  
  -- Если выполнение дошло до этой точки без ошибок,
  -- транзакция автоматически закоммитится
  -- Если на любом из предыдущих шагов произошла ошибка,
  -- все изменения автоматически откатятся
  
EXCEPTION
  -- Обработка исключительных ситуаций
  WHEN OTHERS THEN
    -- Логируем ошибку для отладки
    RAISE WARNING 'Ошибка при создании транзакции дохода: %, %', SQLERRM, SQLSTATE;
    -- Пробрасываем ошибку дальше
    RAISE;
END;$$;


ALTER FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text", "p_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text", "p_date" timestamp with time zone) IS 'Создаёт транзакцию пополнения (дохода) с атомарным обновлением баланса.
   
   Функция выполняет следующие операции в рамках одной транзакции:
   1. Валидирует входные параметры и права доступа
   2. Блокирует баланс кошелька для предотвращения race conditions
   3. Создаёт запись транзакции
   4. Создаёт запись движения средств с новым балансом
   5. Обновляет текущий баланс кошелька
   
   Параметры:
     p_user_id - ID пользователя (для проверки прав доступа)
     p_wallet_id - ID кошелька для пополнения
     p_amount - Сумма дохода (должна быть положительной)
     p_currency - Код валюты (USD, EUR, RUB и т.д.)
     p_source_id - ID источника дохода (зарплата, фриланс и т.д.)
     p_description - Опциональное описание
     p_date - Дата когда произошёл доход (по умолчанию текущая)
   
   Возвращает JSON с информацией о созданной транзакции
   
   Коды ошибок:
     P0002 - Кошелёк не найден или не принадлежит пользователю
     P0004 - Сумма должна быть положительной
     P0005 - Источник дохода не найден
     P0006 - Баланс превысит максимально допустимое значение';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'both'::"text",
    CONSTRAINT "categories_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text", 'both'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."currencies" (
    "code" "text" NOT NULL,
    "numeric_code" integer,
    "name" "text" NOT NULL,
    "symbol" "text",
    "type" "text" DEFAULT 'fiat'::"text" NOT NULL,
    "decimals" integer DEFAULT 2 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."currencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "base_currency" "text" NOT NULL,
    "quote_currency" "text" NOT NULL,
    "rate" numeric(30,10) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."income_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."income_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "currency_code" "text" NOT NULL,
    "amount" numeric(19,4) NOT NULL,
    "balance_after" numeric(19,4) NOT NULL,
    "category_id" "uuid",
    "source_id" "uuid",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_entries_amount_not_zero" CHECK (("amount" <> (0)::numeric)),
    CONSTRAINT "transaction_entries_balance_non_negative" CHECK (("balance_after" >= (0)::numeric))
);


ALTER TABLE "public"."transaction_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text", 'transfer'::"text", 'exchange'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "currency_code" "text" NOT NULL,
    "balance" numeric(19,4) DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallet_balances_non_negative" CHECK (("balance" >= (0)::numeric))
);


ALTER TABLE "public"."wallet_balances" OWNER TO "postgres";


COMMENT ON TABLE "public"."wallet_balances" IS 'Хранит текущие балансы кошельков в различных валютах.';



COMMENT ON COLUMN "public"."wallet_balances"."currency_code" IS 'Код валюты. Должен существовать в справочнике currencies.';



CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'cash'::"text" NOT NULL,
    "primary_currency" "text" DEFAULT 'USD'::"text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."currencies"
    ADD CONSTRAINT "currencies_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_base_currency_quote_currency_created_at_key" UNIQUE ("base_currency", "quote_currency", "created_at");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."income_sources"
    ADD CONSTRAINT "income_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."income_sources"
    ADD CONSTRAINT "income_sources_unique_name_per_user" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_balances"
    ADD CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_balances"
    ADD CONSTRAINT "wallet_balances_unique_wallet_currency" UNIQUE ("wallet_id", "currency_code");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_wallet_balances_currency" ON "public"."wallet_balances" USING "btree" ("currency_code");



CREATE INDEX "idx_wallet_balances_wallet_currency" ON "public"."wallet_balances" USING "btree" ("wallet_id", "currency_code");



CREATE INDEX "idx_wallet_balances_wallet_id" ON "public"."wallet_balances" USING "btree" ("wallet_id");



CREATE INDEX "income_sources_user_active_idx" ON "public"."income_sources" USING "btree" ("user_id", "is_active") WHERE ("deleted_at" IS NULL);



CREATE INDEX "income_sources_user_id_idx" ON "public"."income_sources" USING "btree" ("user_id");



CREATE INDEX "transaction_entries_category_id_idx" ON "public"."transaction_entries" USING "btree" ("category_id") WHERE ("category_id" IS NOT NULL);



CREATE INDEX "transaction_entries_source_id_idx" ON "public"."transaction_entries" USING "btree" ("source_id") WHERE ("source_id" IS NOT NULL);



CREATE INDEX "transaction_entries_transaction_id_idx" ON "public"."transaction_entries" USING "btree" ("transaction_id");



CREATE INDEX "transaction_entries_wallet_currency_idx" ON "public"."transaction_entries" USING "btree" ("wallet_id", "currency_code");



CREATE INDEX "transaction_entries_wallet_id_idx" ON "public"."transaction_entries" USING "btree" ("wallet_id");



CREATE INDEX "transactions_date_idx" ON "public"."transactions" USING "btree" ("date");



CREATE INDEX "transactions_type_idx" ON "public"."transactions" USING "btree" ("type");



CREATE INDEX "transactions_user_date_idx" ON "public"."transactions" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "transactions_user_id_idx" ON "public"."transactions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_currencies_updated_at" BEFORE UPDATE ON "public"."currencies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_income_sources_updated_at" BEFORE UPDATE ON "public"."income_sources" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_wallet_balances_updated_at" BEFORE UPDATE ON "public"."wallet_balances" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."income_sources"
    ADD CONSTRAINT "income_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."income_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_entries"
    ADD CONSTRAINT "transaction_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_balances"
    ADD CONSTRAINT "wallet_balances_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."wallet_balances"
    ADD CONSTRAINT "wallet_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_primary_currency_fkey" FOREIGN KEY ("primary_currency") REFERENCES "public"."currencies"("code");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Enable read access for all users" ON "public"."currencies" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."exchange_rates" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Enable users to view and edit their own data only" ON "public"."income_sources" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view and edit their own data only" ON "public"."wallets" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."categories" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their wallet balances" ON "public"."wallet_balances" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."wallets"
  WHERE (("wallets"."id" = "wallet_balances"."wallet_id") AND ("wallets"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."currencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."income_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select own transaction entries" ON "public"."transaction_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."wallets"
  WHERE (("wallets"."id" = "transaction_entries"."wallet_id") AND ("wallets"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."transaction_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text", "p_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text", "p_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_income_transaction"("p_user_id" "uuid", "p_wallet_id" "uuid", "p_amount" numeric, "p_currency" "text", "p_source_id" "uuid", "p_description" "text", "p_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."currencies" TO "anon";
GRANT ALL ON TABLE "public"."currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."currencies" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."income_sources" TO "anon";
GRANT ALL ON TABLE "public"."income_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."income_sources" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_entries" TO "anon";
GRANT ALL ON TABLE "public"."transaction_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_entries" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_balances" TO "anon";
GRANT ALL ON TABLE "public"."wallet_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_balances" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


































