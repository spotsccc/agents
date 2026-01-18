# Authentication

[← Transactions](./transactions.md) | [Back to Features](./README.md)

## Overview

Authentication is handled by Supabase Auth, providing secure user registration, sign-in, and session management.

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

## Sign Up

New users register at `/auth/sign-up`.

### Required Fields

| Field | Validation |
|-------|------------|
| Email | Valid email format |
| Password | Minimum 6 characters |
| Name | Required |

### Process

1. User submits registration form
2. Supabase Auth creates user account
3. User record created in `users` table
4. User is automatically signed in
5. Redirect to `/wallets`

### Code Reference

```typescript
// useSignUp composable
const { mutate: signUp, isPending } = useSignUp()

signUp({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
})
```

## Sign In

Existing users sign in at `/auth/sign-in`.

### Required Fields

| Field | Validation |
|-------|------------|
| Email | Valid email format |
| Password | Required |

### Process

1. User submits credentials
2. Supabase Auth validates credentials
3. JWT token returned and stored
4. Redirect to `/wallets`

### Code Reference

```typescript
// useSignIn composable
const { mutate: signIn, isPending } = useSignIn()

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
| `useSignIn` | Sign in mutation |
| `useSignUp` | Registration mutation |
| `useLogOut` | Sign out mutation |

### Query Invalidation

Auth mutations automatically invalidate related queries:

```typescript
const { mutate: signIn } = useMutation({
  mutationFn: signInWithEmail,
  onSuccess: () => {
    // Invalidate user-related queries
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
  }
})
```

## UI Components

### Sign In Page

`src/pages/auth/sign-in/page.vue`

- Email input
- Password input
- Sign in button
- Link to sign up

### Sign Up Page

`src/pages/auth/sign-up/page.vue`

- Name input
- Email input
- Password input
- Sign up button
- Link to sign in

## Error Handling

Common auth errors:

| Error | User Message |
|-------|--------------|
| Invalid credentials | "Invalid email or password" |
| Email already exists | "An account with this email already exists" |
| Weak password | "Password must be at least 6 characters" |
| Network error | "Unable to connect. Please try again." |

## Related Documentation

- [Frontend Architecture](../architecture/frontend.md) — State management and routing
- [Backend Architecture](../architecture/backend.md) — API authorization
- [Database Schema](../architecture/database.md#users) — User data model
