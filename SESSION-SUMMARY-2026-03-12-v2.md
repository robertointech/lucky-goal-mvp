# Lucky Goal MVP — Session Summary v2

**Date:** 2026-03-12
**Branch:** main
**Repo:** https://github.com/robertointech/lucky-goal-mvp

---

## Commits Today (newest first)

| Hash | Description |
|------|-------------|
| `d6d19e2` | feat: host dashboard, play again buttons, and i18n system |
| `a180fa1` | feat: add CSV format help text and download template button for custom questions |
| `70fc3bb` | feat: improved penalty graphics, goalkeeper logo upload, and wallet registry |
| `f6a6a7e` | feat: custom cursor, passkey toggle for host, and connect existing wallet on claim |
| `59d248a` | feat: add FAQ page and interactive juggle animation on waiting screens |
| `2f35c7a` | feat: translate entire app from Spanish to English |
| `8578dae` | feat: host can upload custom trivia questions via CSV |
| `54d44c5` | feat: add global ranking with XP system and player achievements |

---

## Features Implemented

### Feature 1 — Global Ranking + XP System
- `global_players` table (nickname, avatar, total_xp, total_games, total_wins, total_goals, wallet_address)
- After each tournament, `processPostTournament()` upserts player stats (XP = tournament score)
- Landing page shows top 10 leaderboard with medals, green glow, games/wins stats, XP

### Feature 2 — Achievement System
- `achievements` table with 6 types: first_match, first_win, first_goal, streak_3, perfect_round, five_games
- Evaluated automatically at tournament end
- Achievement badges displayed in leaderboard

### Feature 3 — Custom Questions (CSV Upload)
- Host uploads CSV with custom trivia questions (min 5, 6 columns)
- Papaparse parsing + validation + preview
- Stored as `custom_questions` JSONB in tournaments table
- CSV format help text + "Download Template" button with 3 example questions

### Feature 4 — FAQ Page
- `/faq` route with 8 accordion-style questions about Lucky Goal
- Gaming-styled design (#00FF88 + #1a1a2e), smooth expand/collapse
- FAQ link in landing page footer

### Feature 5 — Interactive Juggle Animation
- `JuggleBall` component replaces static "Waiting..." spinners
- Tap-to-juggle mini-game with counter and 6 animation variations
- Used in pre-penalty and post-penalty waiting states

### Feature 6 — Custom Cursor
- Triangular "A" SVG cursor (32x32) in #00FF88
- Applied globally via globals.css
- Pointer variant on hover for buttons/links

### Feature 7 — Passkey Toggle for Host
- Toggle switch "Enable Passkey on Join" in host page
- ON: players create wallet when joining; OFF (default): only winner creates wallet
- `passkey_on_join` boolean field on tournaments table (migration 005)

### Feature 8 — Connect Existing Wallet
- Claim page shows two options: "Create wallet with Passkey" or "I already have a wallet"
- Existing wallet option uses Thirdweb ConnectButton (MetaMask, WalletConnect)
- Wallet address saved to Supabase automatically

### Feature 9 — Improved Penalty Graphics
- Visible goalkeeper (🧤) that dives to the correct direction with animation
- Arc trajectory ball animations (per-direction keyframes with rotation)
- GOL: goalkeeper dives wrong way, net shakes green
- SAVE: goalkeeper dives same side, grab animation (🤲)
- Realistic grass field with stripes, penalty spot, goal line, post depth effect

### Feature 10 — Goalkeeper Logo (White-label)
- Host uploads brand logo (PNG/JPG, max 500KB) stored as base64
- Logo displayed on goalkeeper jersey during penalty kicks
- Default "LG" badge when no custom logo
- `goalkeeper_logo` TEXT column on tournaments (migration 006)

### Feature 11 — Wallet Registry
- `wallet_registry` table: wallet_address, nickname, avatar, created_via (passkey/external), tournament_code
- Auto-registered on both Passkey creation and external wallet connection in /claim
- Indexes on wallet_address and tournament_code

### Feature 12 — Host Post-Tournament Dashboard
- Stats cards: total players, avg score, total goals, highest score
- Full player results table: avatar, nickname, score, goals, correct answers, wallet
- Winner row highlighted with crown
- "Export Results (CSV)" button downloads `lucky-goal-{code}-results.csv`
- Correct answer counts queried from answers table via `getCorrectAnswerCounts()`

### Feature 13 — New Tournament / Play Again Buttons
- "Create New Tournament" button on host finished screen → `/host`
- "Play Again" button on player finished screen → `/play`

### Feature 14 — Internationalization (i18n)
- `src/lib/i18n.ts` with ~150 translation keys in EN and ES
- `LanguageContext` provider wraps entire app via layout
- Auto-detects browser language (navigator.language), persists in localStorage
- 🇪🇸/🇺🇸 toggle button fixed top-right on all screens

---

## i18n Adoption Status

| Screen | Uses `t()` | Status |
|--------|-----------|--------|
| Host game (finished/dashboard) | ✅ Yes | Fully translated |
| Landing page `/` | ❌ No | Hardcoded English |
| Host page `/host` | ❌ No | Hardcoded English |
| Play page `/play` | ❌ No | Hardcoded English |
| Join page `/play/join/[code]` | ❌ No | Hardcoded English |
| Player lobby `/play/lobby/[code]` | ❌ No | Hardcoded English |
| Host lobby `/host/lobby/[code]` | ❌ No | Hardcoded English |
| Player game `/play/game/[code]` | ❌ No | Hardcoded English |
| Claim page `/claim/[code]` | ❌ No | Hardcoded English |
| FAQ page `/faq` | ❌ No | Hardcoded English |

> All translation keys exist in `i18n.ts`. Pages need to import `useLanguage()` and replace hardcoded strings with `t("key")`.

---

## SQL Migrations

| File | Status | Description |
|------|--------|-------------|
| `003_global_players_achievements.sql` | ⚠️ Pending | global_players + achievements tables |
| `004_custom_questions.sql` | ⚠️ Pending | custom_questions JSONB on tournaments |
| `005_passkey_on_join.sql` | ⚠️ Pending | passkey_on_join BOOLEAN on tournaments |
| `006_goalkeeper_logo_wallet_registry.sql` | ⚠️ Pending | goalkeeper_logo TEXT on tournaments + wallet_registry table |

> All migrations must be executed manually in Supabase SQL Editor.

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `src/app/faq/page.tsx` | FAQ page with accordion questions |
| `src/components/JuggleBall.tsx` | Interactive juggle mini-game for waiting screens |
| `src/components/LanguageToggle.tsx` | 🇪🇸/🇺🇸 language switch button |
| `src/contexts/LanguageContext.tsx` | React context for i18n state |
| `src/lib/i18n.ts` | Translation dictionary (EN/ES) + helpers |
| `src/lib/walletRegistry.ts` | Wallet registration helper |
| `public/custom-cursor.svg` | Custom cursor (default) |
| `public/custom-cursor-pointer.svg` | Custom cursor (pointer/hover) |
| `supabase/migrations/005_passkey_on_join.sql` | Passkey toggle migration |
| `supabase/migrations/006_goalkeeper_logo_wallet_registry.sql` | Logo + wallet registry migration |

## Files Modified This Session

| File | Changes |
|------|---------|
| `src/app/page.tsx` | FAQ link in footer |
| `src/app/layout.tsx` | LanguageProvider + LanguageToggle wrapper |
| `src/app/globals.css` | Custom cursor styles |
| `src/app/host/page.tsx` | Passkey toggle, goalkeeper logo upload, CSV template download |
| `src/app/host/game/[code]/page.tsx` | Dashboard, CSV export, new tournament button, i18n |
| `src/app/play/game/[code]/page.tsx` | JuggleBall, improved penalty arena, goalkeeper logo, play again button |
| `src/app/claim/[code]/page.tsx` | Wallet choice (passkey/existing), wallet registry |
| `src/types/game.ts` | passkey_on_join, goalkeeper_logo fields |
| `src/lib/gameLogic.ts` | createTournament params, getCorrectAnswerCounts() |

---

## Known Bugs / Issues

1. **No actual AVAX transfer on claim** — contract deployed but host needs real AVAX on Fuji testnet
2. **Winner verification via sessionStorage** — should be server-side for security
3. **Supabase disconnect handling** — player stuck if Realtime drops mid-game
4. **Passkey type fallback** — tries sign-in then sign-up, may show double biometric prompt
5. **Host setTimeout chains** — may have stale closure state for currentQ in edge cases
6. **Goalkeeper logo as base64** — large logos stored directly in DB; should use Supabase Storage for production
7. **i18n partial adoption** — only host dashboard uses `t()`; other screens still hardcoded English

---

## Pending Features / Roadmap

1. **Complete i18n adoption** — Wire `useLanguage()` + `t()` into all remaining screens
2. **Passkey on Join flow** — Actually trigger wallet creation during join when toggle is ON
3. **Host dashboard (live)** — Show real-time player answers during active game
4. **Supabase Storage for logos** — Replace base64 with file upload to Supabase Storage
5. **AVAX mainnet deployment** — Switch from Fuji testnet to mainnet
6. **Dead code cleanup** — Old v1 single-player components + 3D PenaltyScene
7. **Deploy to Vercel** — Connect repo, add env vars, set `npm install --legacy-peer-deps`
8. **Sound effects** — Goal celebration, timer tick, correct/incorrect answer sounds
9. **Spectator mode** — Allow non-players to watch the tournament live
10. **Tournament history** — Host can view past tournaments and results

---

## URLs

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/robertointech/lucky-goal-mvp |
| Vercel | Not deployed yet |
| Snowtrace (Fuji) | https://testnet.snowtrace.io |

---

## Tech Stack

Next.js 16 | React 18 | TypeScript | Tailwind CSS | Supabase Realtime | Thirdweb SDK | Avalanche Fuji | Papaparse | Solidity 0.8.20 | Hardhat
