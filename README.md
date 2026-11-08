# LarpParty

A collection of custom-made minigames for friends. One big screen hosts, and everyone joins on their phone with a 4-letter code. See [AGENTS.md](AGENTS.md) for architecture and team conventions.

## Run locally

Requires Node 20+, pnpm 10, and Docker (for local Supabase).

```bash
pnpm install
supabase start -x studio,imgproxy,storage-api,edge-runtime,logflare,vector,mailpit,postgres-meta,supavisor
supabase status -o env     # copy API_URL, PUBLISHABLE_KEY, SECRET_KEY into .env.local (see .env.example)
pnpm dev                   # http://localhost:3000
```

`supabase start` applies `supabase/migrations/` automatically. To reset the local DB: `supabase db reset`.

To test with real phones on the same Wi-Fi, run `pnpm dev -H 0.0.0.0` and open `http://<your-laptop-ip>:3000`. Point `NEXT_PUBLIC_SUPABASE_URL` at your laptop's IP rather than `127.0.0.1` too.

## Checks

```bash
pnpm test        # engine unit tests (Vitest)
pnpm lint
pnpm typecheck
pnpm build
```

## Deploy

1. Hosted Supabase project: `supabase link --project-ref <ref>`, then `supabase db push` (migrations) and `supabase config push` (turns on anonymous sign-ins).
2. Vercel project env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
3. `vercel --prod`, or push to GitHub with the Vercel integration connected.
