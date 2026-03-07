import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadEnv } from '../src/config/env.js'

describe('loadEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws when BOT_MODE is invalid', () => {
    process.env.BOT_MODE = 'invalid'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'

    expect(() => loadEnv()).toThrow(
      'BOT_MODE is required and must be one of: polling, webhook'
    )
  })

  it('throws when BOT_MODE is not set', () => {
    delete process.env.BOT_MODE
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'

    expect(() => loadEnv()).toThrow('BOT_MODE is required')
  })

  it('throws when TELEGRAM_BOT_TOKEN is not set', () => {
    process.env.BOT_MODE = 'polling'
    delete process.env.TELEGRAM_BOT_TOKEN

    expect(() => loadEnv()).toThrow(
      'TELEGRAM_BOT_TOKEN is required but not set'
    )
  })

  it('returns typed config for valid env', () => {
    process.env.BOT_MODE = 'polling'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'

    const config = loadEnv()

    expect(config).toEqual({
      BOT_MODE: 'polling',
      TELEGRAM_BOT_TOKEN: 'test-token',
    })
  })

  it('accepts webhook as valid BOT_MODE', () => {
    process.env.BOT_MODE = 'webhook'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'

    const config = loadEnv()

    expect(config.BOT_MODE).toBe('webhook')
  })
})
