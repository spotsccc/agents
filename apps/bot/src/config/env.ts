import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import env from 'env-var'

const envLocalPath = resolve(import.meta.dirname, '../../.env.local')
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath)
}

export interface BotEnv {
  BOT_MODE: 'polling' | 'webhook'
  TELEGRAM_BOT_TOKEN: string
}

export interface WebhookSetupEnv {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_URL: string
  TELEGRAM_WEBHOOK_SECRET?: string
}

const VALID_BOT_MODES = ['polling', 'webhook'] as const

export function loadEnv(): BotEnv {
  return {
    BOT_MODE: env.get('BOT_MODE').required().asEnum(VALID_BOT_MODES),
    TELEGRAM_BOT_TOKEN: env.get('TELEGRAM_BOT_TOKEN').required().asString(),
  }
}

export function loadWebhookSetupEnv(): WebhookSetupEnv {
  return {
    TELEGRAM_BOT_TOKEN: env.get('TELEGRAM_BOT_TOKEN').required().asString(),
    TELEGRAM_WEBHOOK_URL: env.get('TELEGRAM_WEBHOOK_URL').required().asUrlString(),
  }
}
