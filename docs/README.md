# Wallet Manager Documentation

> Multi-currency wallet and transaction management application

## Quick Links

| Section | Description |
|---------|-------------|
| [Project Overview](./overview.md) | Goals, problems solved, and key features |
| [Architecture](./architecture/README.md) | Technical architecture and design decisions |
| [Features](./features/README.md) | Detailed feature documentation |

## Documentation Structure

```
docs/
├── README.md                    # You are here
├── overview.md                  # Project goals and value proposition
├── architecture/
│   ├── README.md                # Architecture overview
│   ├── frontend.md              # Vue 3 + TypeScript frontend
│   ├── backend.md               # Supabase Edge Functions
│   └── database.md              # PostgreSQL schema
└── features/
    ├── README.md                # Features overview
    ├── authentication.md        # Auth system
    ├── wallets.md               # Wallet management
    └── transactions.md          # Transaction types
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local Supabase)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase:start

# Run development server
pnpm dev
```

See [Architecture > Frontend](./architecture/frontend.md#development-commands) for all available commands.

## Tech Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, TypeScript, TanStack Query, Tailwind CSS |
| UI Components | shadcn-vue (Reka UI), Lucide Icons |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| Edge Functions | Deno, Kysely ORM |
| Build | Vite 7, Turborepo, pnpm |
| Testing | Vitest, Playwright, Storybook |

For detailed technical information, see [Architecture](./architecture/README.md).

## Project Links

| Resource | URL |
|----------|-----|
| Production | https://agents-web-chi.vercel.app |
| GitHub | https://github.com/spotsccc/agents |
| Vercel Dashboard | https://vercel.com/spotscccs-projects/agents-web |

## Related Resources

- [CLAUDE.md](../CLAUDE.md) — AI assistant guidelines for this codebase
