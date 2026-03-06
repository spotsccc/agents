export interface BotEnv {
  BOT_MODE: 'polling' | 'webhook'
  TELEGRAM_BOT_TOKEN: string
}

const VALID_BOT_MODES = ['polling', 'webhook'] as const

export function loadEnv(): BotEnv {
  const botMode = process.env.BOT_MODE
  if (!botMode || !VALID_BOT_MODES.includes(botMode as (typeof VALID_BOT_MODES)[number])) {
    throw new Error(
      `BOT_MODE is required and must be one of: ${VALID_BOT_MODES.join(', ')}. Got: ${botMode ?? '(not set)'}`
    )
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required but not set')
  }

  return {
    BOT_MODE: botMode as BotEnv['BOT_MODE'],
    TELEGRAM_BOT_TOKEN: token,
  }
}
