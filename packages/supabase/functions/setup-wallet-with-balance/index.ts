import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'
import { createClient } from 'supabase'

import type { SetupWalletWithBalanceRequest } from './contract.ts'
import type { KyselyDatabase } from '../../scheme/kysely.ts'

const pool = new Pool({
  connectionString: Deno.env.get('SUPABASE_DB_URL'),
  max: 1,
})

const db = new Kysely<KyselyDatabase>({
  dialect: new PostgresDialect({ pool }),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (!user || authError) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: SetupWalletWithBalanceRequest = await req.json()
    const { walletName, walletDescription, balances } = body

    // Validation
    if (!walletName || walletName.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Wallet name must be at least 3 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!balances || balances.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one balance is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check for duplicate currencies
    const currencies = balances.map((b) => b.currency)
    const uniqueCurrencies = new Set(currencies)
    if (currencies.length !== uniqueCurrencies.size) {
      return new Response(
        JSON.stringify({ error: 'Duplicate currencies are not allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    for (const balance of balances) {
      if (balance.amount < 0) {
        return new Response(
          JSON.stringify({
            error: `Balance amount must be non-negative, got: ${balance.amount}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Execute in transaction
    const result = await db.transaction().execute(async (trx) => {
      // Set service role to bypass RLS
      await sql`SET LOCAL ROLE service_role`.execute(trx)

      // Create wallet
      const newWallet = await trx
        .insertInto('wallets')
        .values({
          user_id: user.id,
          name: walletName,
          description: walletDescription || null,
        })
        .returning(['id', 'name', 'description', 'created_at'])
        .executeTakeFirstOrThrow()

      // Create balances
      const createdBalances: Array<{
        id: string
        currency_code: string
        balance: number
      }> = []

      for (const balance of balances) {
        if (balance.amount > 0) {
          const newBalance = await trx
            .insertInto('wallet_balances')
            .values({
              wallet_id: newWallet.id,
              currency_code: balance.currency,
              balance: balance.amount,
            })
            .returning(['id', 'currency_code', 'balance'])
            .executeTakeFirstOrThrow()

          createdBalances.push({
            id: newBalance.id,
            currency_code: newBalance.currency_code,
            balance: Number(newBalance.balance),
          })
        }
      }

      return {
        wallet: newWallet,
        balances: createdBalances,
      }
    })

    return new Response(
      JSON.stringify({
        wallet_id: result.wallet.id,
        wallet_name: result.wallet.name,
        wallet_description: result.wallet.description,
        balances: result.balances,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error setting up wallet with balance:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
