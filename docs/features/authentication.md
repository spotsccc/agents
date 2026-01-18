# Authentication

[← Transactions](./transactions.md) | [Back to Features](./README.md)

## Overview

Authentication is handled by Supabase Auth, providing secure user registration, sign-in, and session management. The primary authentication method is OTP (One-Time Password) via email, with password-based authentication available as a secondary option.

## Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────┐      ┌──────────────┐      ┌──────────────┐     │
│   │  User    │─────►│ Supabase     │─────►│  JWT Token   │     │
│   │  Input   │      │ Auth         │      │  + Session   │     │
│   └──────────┘      └──────────────┘      └──────┬───────┘     │
│                                                  │              │
│                                                  ▼              │
│                            ┌─────────────────────────────┐      │
│                            │   Stored in Browser        │      │
│                            │   (localStorage/cookies)   │      │
│                            └─────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## OTP Authentication (Primary)

OTP authentication is the primary sign-in method. Users receive a 6-digit code via email to verify their identity.

### OTP Sign In Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Step 1: Email Entry         Step 2: OTP Verification         │
│   ┌──────────────────┐        ┌──────────────────┐             │
│   │ Enter email      │───────►│ Enter 6-digit    │             │
│   │ [Send Code]      │  OTP   │ code from email  │             │
│   └──────────────────┘  sent  │ [Verify]         │             │
│                               └────────┬─────────┘             │
│                                        │                        │
│                                        ▼                        │
│                               ┌──────────────────┐             │
│                               │  Authenticated   │             │
│                               │  → /wallets      │             │
│                               └──────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Reference

```typescript
// Send OTP to email
const { mutate: sendOtp, isPending } = useSignInWithOtp()

sendOtp({ email: 'user@example.com' })

// Verify OTP code
const { mutate: verifyOtp, isPending } = useVerifyOtp()

verifyOtp({
  email: 'user@example.com',
  token: '123456'
})
```

### OTP Features

| Feature | Description |
|---------|-------------|
| Resend Code | Available after 60-second countdown |
| Change Email | Return to email entry from verification step |
| Code Length | 6 digits |
| Code Expiry | Managed by Supabase (typically 1 hour) |

## Sign Up

New users register at `/auth/sign-up` using OTP authentication.

### Required Fields

| Field | Validation |
|-------|------------|
| Email | Valid email format |

### Process

1. User enters email address
2. Supabase sends OTP code to email
3. User enters 6-digit verification code
4. Supabase Auth creates user account (if new)
5. User is automatically signed in
6. Redirect to `/wallets`

### Code Reference

```typescript
// Sign up uses the same OTP flow - Supabase auto-creates accounts
const { mutate: sendOtp } = useSignInWithOtp()
const { mutate: verifyOtp } = useVerifyOtp()

// Step 1: Send code
sendOtp({ email: 'newuser@example.com' })

// Step 2: Verify and create account
verifyOtp({
  email: 'newuser@example.com',
  token: '123456'
})
```

## Sign In

Existing users sign in at `/auth/sign-in` with OTP (primary) or password (secondary).

### OTP Sign In (Primary)

| Field | Validation |
|-------|------------|
| Email | Valid email format |
| Verification Code | 6 digits |

### Password Sign In (Secondary)

| Field | Validation |
|-------|------------|
| Email | Valid email format |
| Password | Minimum 6 characters |

### Process (OTP)

1. User enters email address
2. Clicks "Send Code"
3. Supabase sends OTP to email
4. User enters verification code
5. Clicks "Verify"
6. Redirect to `/wallets`

### Process (Password)

1. User clicks "Sign in with password instead"
2. Enters email and password
3. Supabase Auth validates credentials
4. JWT token returned and stored
5. Redirect to `/wallets`

### Code Reference

```typescript
// OTP sign in (primary)
const { mutate: sendOtp } = useSignInWithOtp()
const { mutate: verifyOtp } = useVerifyOtp()

sendOtp({ email: 'user@example.com' })
verifyOtp({ email: 'user@example.com', token: '123456' })

// Password sign in (secondary)
const { mutate: signIn } = useSignIn()

signIn({
  email: 'user@example.com',
  password: 'password123'
})
```

## Sign Out

Users can sign out from the application.

### Process

1. User clicks sign out
2. Supabase Auth invalidates session
3. Local token cleared
4. Redirect to `/auth/sign-in`

### Code Reference

```typescript
// useLogOut composable
const { mutate: logOut } = useLogOut()

logOut()
```

## Session Management

### useUser Composable

Provides reactive access to current user:

```typescript
const { user, isLoading } = useUser()

// Reactive - updates when auth state changes
if (user.value) {
  console.log('Signed in as:', user.value.email)
}
```

### Auth State Changes

The app listens for auth state changes:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'SIGNED_OUT') {
    // User signed out
  }
})
```

## Route Protection

### Navigation Guards

Vue Router guards protect authenticated routes:

```typescript
router.beforeEach(async (to) => {
  const { user } = await getCurrentUser()

  // Protected routes require authentication
  if (!user && !to.path.startsWith('/auth')) {
    return '/auth/sign-in'
  }

  // Auth pages redirect authenticated users
  if (user && to.path.startsWith('/auth')) {
    return '/wallets'
  }
})
```

### Route Structure

| Route Pattern | Access | Redirect If |
|---------------|--------|-------------|
| `/auth/*` | Public | Authenticated → `/wallets` |
| `/wallets/*` | Protected | Not authenticated → `/auth/sign-in` |
| `/*` | — | → `/wallets` |

## API Authorization

### Edge Function Calls

All API calls include the auth token:

```typescript
// Automatic header injection
const { data, error } = await supabase.functions.invoke('create-income-transaction', {
  body: { /* ... */ }
})
// Authorization: Bearer <jwt-token> added automatically
```

### Token Validation

Edge Functions validate the token:

```typescript
// In Edge Function
const authHeader = req.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')

const { data: { user }, error } = await supabase.auth.getUser(token)

if (!user) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Security Features

### Password Security

- Passwords hashed by Supabase Auth (bcrypt)
- Never stored in plain text
- Minimum length enforced

### OTP Security

- Codes are single-use
- Codes expire after a set time period
- Rate limiting prevents brute force attacks

### Session Security

- JWT tokens with expiration
- Refresh tokens for extended sessions
- Secure cookie storage option

### Data Isolation

- All data queries filter by `user_id`
- Row Level Security enforces at database level
- See [Database > Row Level Security](../architecture/database.md#row-level-security)

## Auth Composables

Located in `src/shared/auth/`:

| Composable | Purpose |
|------------|---------|
| `useUser` | Get current user (reactive) |
| `useSignInWithOtp` | Send OTP code to email |
| `useVerifyOtp` | Verify OTP code and sign in |
| `useSignIn` | Password-based sign in |
| `useSignUp` | Registration mutation (password-based, legacy) |
| `useLogOut` | Sign out mutation |

### Query Invalidation

Auth mutations automatically invalidate related queries:

```typescript
const { mutate: verifyOtp } = useMutation({
  mutationFn: verifyOtpCode,
  onSuccess: () => {
    // Invalidate user-related queries
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }
})
```

## UI Components

### Sign In Page

`src/pages/auth/sign-in/page.vue`

**OTP Flow (Primary):**
- Email input
- "Send Code" button
- Verification code input (step 2)
- "Verify" button (step 2)
- "Change email" link (step 2)
- "Resend code" with countdown (step 2)

**Password Flow (Secondary):**
- Toggle: "Sign in with password instead"
- Email input
- Password input
- "Sign In" button

**Navigation:**
- Link to sign up page

### Sign Up Page

`src/pages/auth/sign-up/page.vue`

- Email input
- "Continue" button
- Verification code input (step 2)
- "Verify" button (step 2)
- "Change email" link (step 2)
- "Resend code" with countdown (step 2)
- Link to sign in page

## Error Handling

Common auth errors:

| Error | User Message |
|-------|--------------|
| Invalid credentials | "Invalid email or password" |
| Invalid OTP code | "Invalid code. Please try again." |
| OTP send failed | "Failed to send code. Please try again." |
| Email already exists | "An account with this email already exists" |
| Weak password | "Password must be at least 6 characters" |
| Invalid code length | "Code must be 6 digits" |
| Network error | "Unable to connect. Please try again." |

## Related Documentation

- [Frontend Architecture](../architecture/frontend.md) — State management and routing
- [Backend Architecture](../architecture/backend.md) — API authorization
- [Database Schema](../architecture/database.md#users) — User data model
