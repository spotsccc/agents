import { loadEnv } from './config/env.js'
import { createBot } from './bot.js'

const env = loadEnv()
const bot = createBot(env.TELEGRAM_BOT_TOKEN)

console.log('Starting bot in polling mode...')
void bot.start()
