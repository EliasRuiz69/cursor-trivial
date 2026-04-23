# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

There are no automated tests in this project.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
WIKIPEDIA_API_BASE=https://es.wikipedia.org/api/rest_v1  # optional, has default
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM=Trivial Retro <noreply@tudominio.com>
```

## Architecture

**Trivial Retro** is a Spanish-language trivia game built with Next.js 16, NextAuth (Credentials provider), Supabase (Postgres), and Tailwind CSS v4.

### Routing

- `/` — redirects to `/login` or `/welcome` based on session
- `(auth)` route group: `/login`, `/register`, `/forgot-password`, `/reset-password` — public, no session required
- `(game)` route group: `/welcome`, `/play` — require authentication, redirect to `/login` if not authenticated

### Authentication

NextAuth Credentials provider stores and verifies users in Supabase directly — **not** via Supabase Auth. The `player_profiles` table uses `user_id = email (lowercase)` as the identifier. Passwords are hashed with bcrypt (12 rounds). JWT session strategy with 30-day expiry.

`authOptions` is exported from `app/api/auth/[...nextauth]/route.ts` and imported wherever `getServerSession` is called.

### Supabase Clients

Two clients in `lib/supabase.ts`:
- `createServerSupabaseClient()` — uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS. Use in API routes and Server Components only.
- `createBrowserSupabaseClient()` — uses anon key, singleton, respects RLS. For Client Components.

### Database Schema (Supabase)

**`player_profiles`**: `id` (uuid), `user_id` (email, unique), `display_name`, `total_points` (default 0), `password_hash`, `created_at`, `updated_at`

**`score_history`**: `id`, `player_id` (FK → player_profiles.id), `tema`, `preguntas_realizadas`, `aciertos`, `fallos`, `updated_at`. Unique constraint on `(player_id, tema)`.

**`password_reset_tokens`**: `id` (uuid), `player_id` (FK → player_profiles.id), `token` (unique hex string), `expires_at` (30 min TTL), `used_at` (null until consumed), `created_at`. Index on `token`.

### Password Reset Flow

1. `POST /api/auth/forgot-password` — looks up the email in `player_profiles`, generates a `crypto.randomBytes(32).toString('hex')` token, inserts into `password_reset_tokens`, and calls `lib/email.ts` to send the reset link. Always returns `{ ok: true }` regardless of whether the email exists (prevents enumeration).
2. `POST /api/auth/reset-password` — validates the token (exists, not `used_at`, not expired), hashes the new password with bcrypt (12 rounds), updates `player_profiles.password_hash`, then sets `used_at` to invalidate the token.

Email is sent via nodemailer SMTP (`lib/email.ts`). Configure with `EMAIL_SMTP_*` env vars.

### API Routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/register` | POST | Create new player |
| `/api/auth/forgot-password` | POST | Generate reset token and send email |
| `/api/auth/reset-password` | POST | Validate token and update password |
| `/api/questions` | GET | Fetch a question for a topic |
| `/api/questions` | POST | Validate player's answer |
| `/api/player` | GET | Fetch profile + score history |
| `/api/player` | PATCH | Update display_name or total_points |
| `/api/player` | POST | Upsert score_history + update total_points |

### Question Security Model

Correct answers are **never sent to the client**. When `GET /api/questions` is called, the server generates a UUID `preguntaId`, stores the correct answer + explanation in a server-side in-memory `Map` (`preguntasSecretas`) with a 30-minute TTL, and returns only the public question. `POST /api/questions` validates the answer by looking up the `preguntaId` in the map, then deletes it (single-use).

**Important**: This in-memory store is lost on server restart/redeployment. Questions expire after 30 minutes.

### Question Sources

Questions are sourced from two places, with fallback:
1. **Wikipedia API** (`lib/wikipedia.ts`) — fetches article summaries from `es.wikipedia.org` for a rotating list of articles per topic, then tries to extract year-based questions. Per-session article rotation prevents repeats.
2. **Static bank** (`app/api/questions/route.ts`) — 8 hardcoded questions per topic (Historia, Geografía, Matemáticas, Cine). Used when Wikipedia fails or yields no parseable question.

Options are always shuffled before sending to the client; the server tracks the new correct letter post-shuffle.

### Scoring

- Correct answer: **+2 points**
- Wrong answer: **-1 point** (floor at 0, never negative)
- Points stored in `player_profiles.total_points` and per-topic stats in `score_history`

### Component Structure

- `components/ui/` — generic primitives: `BotonRetro`, `Modal`, `SessionProvider`
- `components/game/` — game-specific: `SeleccionTema`, `TarjetaPregunta`, `Marcador`, `ModalReglas`, `ModalSalir`
- `lib/types.ts` — shared types used by both frontend and API routes (`Tema`, `PreguntaPublica`, `ResultadoRespuesta`, `PlayerProfile`, `ScoreHistory`)

### Styling

Tailwind CSS v4 (PostCSS plugin, not CLI). Retro pixel aesthetic using `Press Start 2P` (headings) and `Courier Prime` (body text) from Google Fonts. Color palette is defined inline in className strings — no CSS variables or theme config file.
