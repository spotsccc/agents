import { pathToFileURL } from 'node:url'
import { loadWebhookSetupEnv } from '../src/config/env.js'

interface TelegramApiResponse {
  ok: boolean
  description?: string
}

async function setupWebhook(): Promise<void> {
  const env = loadWebhookSetupEnv()

  const setWebhookResponse = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: env.TELEGRAM_WEBHOOK_URL,
        allowed_updates: ['message'],
        ...(env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: env.TELEGRAM_WEBHOOK_SECRET } : {}),
      }),
    },
  )

  const setWebhookData = (await setWebhookResponse.json()) as TelegramApiResponse

  if (!setWebhookResponse.ok || !setWebhookData.ok) {
    throw new Error(
      `Telegram API setWebhook failed: ${setWebhookData.description ?? `HTTP ${setWebhookResponse.status}`}`,
    )
  }

  const setMyCommandsResponse = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        commands: [
          {
            command: 'start',
            description: 'Показать приветствие',
          },
        ],
      }),
    },
  )

  const setMyCommandsData = (await setMyCommandsResponse.json()) as TelegramApiResponse

  if (!setMyCommandsResponse.ok || !setMyCommandsData.ok) {
    throw new Error(
      `Telegram API setMyCommands failed: ${setMyCommandsData.description ?? `HTTP ${setMyCommandsResponse.status}`}`,
    )
  }
}

async function main(): Promise<void> {
  await setupWebhook()
  console.log('Telegram webhook configured successfully')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Telegram webhook setup failed')
    process.exit(1)
  })
}
