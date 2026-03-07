import { describe, it, expect } from 'vitest'
import { app } from '../src/index.js'

function req(
  method: string,
  options?: { contentType?: string; body?: string }
) {
  return new Request('http://localhost/api/telegram', {
    method,
    body: options?.body,
  })
}

describe('POST /api/telegram', () => {
  it('returns 200 for valid POST with application/json', async () => {
    const res = await app.request(
      req('POST', {
        contentType: 'application/json',
        body: JSON.stringify({ update_id: 1 }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 200 for application/json; charset=utf-8', async () => {
    const res = await app.request(
      req('POST', {
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ update_id: 2 }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 400 for invalid JSON body', async () => {
    const res = await app.request(
      req('POST', {
        contentType: 'application/json',
        body: 'not-json{{{',
      })
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ ok: false, error: 'invalid_json' })
  })

  it('returns 405 for GET with Allow header', async () => {
    const res = await app.request(req('GET'))

    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
  })

  it('returns 405 for PUT with Allow header', async () => {
    const res = await app.request(req('PUT'))

    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('POST')
  })
})
