# Google OAuth2 Flow

> OAuth2 consent flow in web UI + encrypted token storage in Supabase.

---

## Overview

User connects their Google Calendar via a standard OAuth2 flow in the web app settings page. Tokens are encrypted and stored in Supabase for use by the bot and Edge Functions.

---

## Implementation

### Web UI (apps/web)

- Settings page: "Connect Google Calendar" button
- OAuth2 redirect handler (callback page)
- Show connection status (connected / not connected)
- "Disconnect" button -- deletes tokens from DB, revokes Google access

### OAuth2 Flow

1. User clicks "Connect Google Calendar"
2. Redirect to Google consent screen with scopes: `calendar.events`, `calendar.readonly`
3. Google redirects back with authorization code
4. Callback page exchanges code for access + refresh tokens
5. Tokens are encrypted with AES-256-GCM and stored in `user_google_tokens`
6. UI shows "Connected" status

### Security & Encryption

- Tokens are encrypted with **AES-256-GCM** before storing in DB
- `ENCRYPTION_KEY` stored as environment variable
- The same `ENCRYPTION_KEY` must be available in:
  - **Vercel** (bot) -- for calendar operations triggered by user messages
  - **Supabase Edge Functions** -- for briefing composition (Briefing use case)
- Key rotation strategy: TBD (out of scope, but design schema to support it -- e.g., `key_version` column)

### Token Lifecycle

- Access tokens expire (typically 1 hour). On expiry, use refresh token to obtain new access token.
- If Google revokes the refresh token (user removes access in Google Account settings), the bot should detect the 401 error, notify the user, and mark the connection as disconnected in the UI.
- Edge case: if re-encryption fails after token refresh, retry once, then notify user.

---

## Database Schema

```sql
-- Google Calendar tokens (encrypted with AES-256-GCM)
create table user_google_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS Policies

- Users can read/update their own tokens
- Bot service role can read (for calendar operations on behalf of user)
- Access tokens should never be exposed to the client -- decryption happens server-side only (Edge Functions / Vercel serverless)

---

## Secrets Management

| Secret | Used by | Storage |
|--------|---------|---------|
| `GOOGLE_CLIENT_ID` | Web app (OAuth flow) | Vercel env vars |
| `GOOGLE_CLIENT_SECRET` | Bot + Edge Functions (token refresh) | Vercel env vars + Supabase secrets |
| `ENCRYPTION_KEY` | Bot + Edge Functions (token encrypt/decrypt) | Vercel env vars + Supabase secrets |

Both Vercel and Supabase Edge Functions need `ENCRYPTION_KEY` and `GOOGLE_CLIENT_SECRET`. Ensure they are kept in sync during deployment.
