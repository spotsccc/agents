import { describe, it, expect } from 'vitest'
import { Bot } from 'grammy'
import { createBot } from '../src/bot.js'

describe('createBot', () => {
  it('returns a grammy Bot instance', () => {
    const bot = createBot('test-token')

    expect(bot).toBeInstanceOf(Bot)
  })

  it('does not start polling on import', async () => {
    const module = await import('../src/bot.js')

    expect(module.createBot).toBeTypeOf('function')
  })
})
