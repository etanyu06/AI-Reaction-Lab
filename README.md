# AI Reaction Lab

Landing page testing with participant recordings and AI research summaries.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set Supabase values.

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Useful Commands

```bash
npm run typecheck
npm run build
```

## Supabase

Apply SQL in this order:

1. `supabase/schema.sql`
2. `supabase/rls.sql`
3. Optional local demo data: `supabase/seed.sql`
