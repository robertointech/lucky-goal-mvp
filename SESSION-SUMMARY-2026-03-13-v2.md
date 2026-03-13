# Lucky Goal MVP — Session Summary v2

**Date:** 2026-03-13
**Branch:** main
**Repo:** https://github.com/robertointech/lucky-goal-mvp

---

## Commits Today (newest first)

| Hash | Description |
|------|-------------|
| `396cc89` | feat: landing redesign, sound effects, host airdrop, penalty animation overhaul |
| `6c757e1` | docs: add session summary for 2026-03-13 |
| `9ba0e40` | feat: juggle muecas, collectible medals system, and host messaging |
| `0b9f231` | feat: add token selector for prize currency on host page |
| `2fc6716` | fix: resolve 5 critical bugs — host navigation, passkey on join, timer sync, realtime recovery, iOS passkey order |

---

## Bugs Fixed (5)

### Bug 1 — Host screen stuck after "Start Game"
- **File:** `src/app/host/lobby/[code]/page.tsx`
- **Root cause:** `handleStart` had no try/catch; if `updateTournamentStatus` was slow or threw, `router.push` never executed
- **Fix:** Added try/catch/finally, `starting` loading state, disabled button with spinner, `router.push` in `finally` so it always navigates

### Bug 2 — Passkey on Join not implemented
- **File:** `src/app/play/join/[code]/page.tsx`
- **Root cause:** Player join flow completely ignored `tournament.passkey_on_join` field
- **Fix:** After `joinTournament()`, checks `passkey_on_join`; if true, triggers Thirdweb passkey wallet creation (sign-up first, sign-in fallback), saves wallet via `setPlayerWallet` + `registerWallet`, then navigates to lobby regardless of outcome

### Bug 3 — Timer desync (host 19s, player 17s)
- **Files:** `src/lib/gameLogic.ts`, `src/types/game.ts`, `src/app/play/game/[code]/page.tsx`, migration 007
- **Root cause:** Host and player ran completely independent `useCountdown(20)` timers; player started 1-3s late due to Realtime latency
- **Fix:** `updateTournamentStatus` now writes `question_started_at` timestamp when status is "question"; player calculates `remaining = 20 - elapsed` from that timestamp instead of running an independent timer

### Bug 4 — Player stuck on question 1
- **File:** `src/hooks/useGameSync.ts`
- **Root cause:** Only re-fetched on initial `SUBSCRIBED` event; missed Realtime events left player with stale state forever
- **Fix:** Added 5-second polling fallback (periodic re-fetch of tournament row); `.subscribe()` callback now also handles `CHANNEL_ERROR` and `TIMED_OUT` with immediate re-fetch

### Bug 5 — iOS "Sign In" popup before Passkey
- **File:** `src/app/claim/[code]/page.tsx`
- **Root cause:** Code tried `type: "sign-in"` first, triggering iOS native credential picker (double prompt)
- **Fix:** Inverted order — `type: "sign-up"` first (new wallet), fallback to `type: "sign-in"` (returning users)

---

## Features Implemented

### Feature 15 — Funny Faces in Juggle Animation
- **File:** `src/components/JuggleBall.tsx`
- 6 rotating emoji muecas on each tap: 😝 😜 🤪 😵‍💫 🥴 😤
- Face returns to neutral 🙂 after 1 second of inactivity
- Scale bounce "impact" animation (1.3x with spring cubic-bezier) when ball lands on head
- Existing ball animations, counter, and leg kick preserved

### Feature 16 — Collectible Medals System
- **New table:** `medals` (id, player_id ref global_players, medal_type, tournament_code, earned_at)
- **5 medal types:**
  - 🎖️ `og_participant` — Participated in a tournament
  - 🏅 `champion` — Won a tournament
  - 🎯 `sharpshooter` — Scored 3+ goals in one tournament
  - 📚 `scholar` — All answers correct in one tournament
  - 🤝 `social` — Played in a tournament with 5+ players
- Evaluated automatically at tournament end via `evaluateMedals()` in `processPostTournament`
- Medals displayed in global leaderboard (landing page) — deduplicated by type, shown as small icons
- New `/medals` gallery page: all 5 medals as styled cards, earned ones glow green, locked at 40% opacity
- Queries player medals via `lucky_goal_wallet` localStorage key
- **Migration:** `008_medals.sql`

### Feature 17 — Host Messaging Dashboard
- **New table:** `messages` (id, tournament_code, sender_wallet, recipient_wallet, message_text, read, created_at)
- Host finished screen: "Send Message to Players" section with textarea + "Send to All" button
- Sends to all players who have `wallet_address` in the tournament
- New `/inbox` page: players see received messages with unread dot indicators, mark-all-read on load
- Landing page: inbox link with unread count badge (fetched via `getUnreadCount`)
- Wallet saved to `localStorage("lucky_goal_wallet")` on claim (both passkey and external wallet paths)
- **Helper library:** `src/lib/messages.ts` (send, sendToAll, getInbox, unreadCount, markRead, markAllAsRead)
- **Migration:** `009_messages.sql`

### Token Selector (UI enhancement)
- **File:** `src/app/host/page.tsx`
- 4 token cards in horizontal grid: AVAX (active, green glow border), USDt, ETH, USDC (disabled, "SOON" badge, 50% opacity)
- Placed above the prize amount input

### Feature 18 — Landing Page Redesign
- **File:** `src/app/page.tsx`
- **6 sections** scrolling top-to-bottom:
  1. **Hero** — Background image (`/hero.jpeg`), logo, tagline with fade-in animation, CTA buttons (Create Tournament + Join), scroll indicator chevron
  2. **How it Works** — 3 glassmorphism cards with numbered step badges: Create Tournament → Players Join → Win Prizes
  3. **Why Lucky Goal** — 4 feature cards: Real-time Sync, Passkey Wallets, On-chain Prizes, Custom Questions
  4. **Global Ranking** — Existing leaderboard preserved exactly (achievements, medals, XP)
  5. **Medals Showcase** — All 5 medal types as styled cards from MEDAL_META
  6. **Footer** — Links to FAQ, GitHub, Snowtrace, Medals, Inbox (with unread badge)
- **Scroll animations** via IntersectionObserver (`useInView` callback ref hook) — each section fades in + slides up on scroll
- 18 new i18n keys (EN + ES)

### Feature 19 — Sound Effects
- **New file:** `src/lib/sounds.ts`
- **Web Audio API** oscillator-based tones (no external audio files):
  - `playCorrect()` — ascending two-note ding (C5 → G5)
  - `playIncorrect()` — descending sawtooth buzz
  - `playGoal()` — crowd fanfare ascending major arpeggio (~1s)
  - `playSaved()` — low whomp (single bass tone)
  - `playWin()` — victory fanfare trumpet-like sequence (~1.5s)
- **AudioContext** created lazily on first user interaction (browser autoplay policy)
- **Mute/unmute** toggle in player game header (speaker emoji), state in `localStorage`
- Sound triggers via `useEffect` on `lastAnswerCorrect`, `penaltyResult`, and `status`/`winner`
- Sounds only play on player's phone (player game page only)

### Feature 20 — Airdrop from Host Dashboard
- **File:** `src/app/host/game/[code]/page.tsx`
- New `AirdropCard` component in finished phase dashboard
- **Input** for total AVAX amount to airdrop
- **Preview**: "Send X AVAX to each of N players (Y AVAX total)" where N = players with wallets
- **Two-step confirmation**: click "Airdrop" → shows "Confirm Airdrop" + "Cancel"
- **Sequential transactions**: sends individual native AVAX transfers to each player wallet via `prepareTransaction` + `toWei` from Thirdweb
- **Progress indicator**: "Sending 3/5..."
- **Error handling** with retry capability
- 10 new i18n keys (EN + ES)

### Feature 21 — Penalty Animation Overhaul
- **File:** `src/app/play/game/[code]/page.tsx`
- **New `GoalkeeperSVG` component** — full hand-drawn SVG character:
  - Head with hair, eyes (with shine), nose, mouth (expression changes on save)
  - Eyebrows (furrowed on save)
  - Torso in red jersey with center stripe and collar
  - Logo on jersey (custom `goalkeeperLogo` or "LG" fallback)
  - Arms with yellow gloves, independent arm angles per dive direction
  - Legs with boots and highlight
- **Dive animation**: translate + rotate via CSS transition (0.55s cubic-bezier), arm angles stretch toward dive side
- **Full SVG scene** (`viewBox="0 0 320 240"`):
  - Thick white posts with depth shadows and inner highlights
  - Crossbar with shadow
  - Net grid (19 vertical + 10 horizontal lines)
  - Net ripple overlay in green on GOAL
  - Alternating grass stripes
  - Penalty area box lines + penalty spot
  - 3 clickable direction zones with highlight + labels
- **Ball animations**:
  - Idle float at penalty spot with green glow on direction select
  - Curved arc trajectory via `ballArcSvg_{dir}` keyframes (translate + scale + rotate)
- **GOAL celebration**: 12-particle radial burst (green/gold/white) + "GOAL!" text with spring scale
- **SAVED**: shake animation + red text glow
- **New CSS keyframes**: `ballArcSvg_left/center/right`, `ballFloat`, `particleBurst`, improved `netShake`, improved `goalCelebrate`

---

## SQL Migrations

| File | Status | Description |
|------|--------|-------------|
| `003_global_players_achievements.sql` | ⚠️ Pending | global_players + achievements tables |
| `004_custom_questions.sql` | ⚠️ Pending | custom_questions JSONB on tournaments |
| `005_passkey_on_join.sql` | ⚠️ Pending | passkey_on_join BOOLEAN on tournaments |
| `006_goalkeeper_logo_wallet_registry.sql` | ⚠️ Pending | goalkeeper_logo TEXT + wallet_registry table |
| `007_question_started_at.sql` | ⚠️ Pending | question_started_at TIMESTAMPTZ on tournaments |
| `008_medals.sql` | ⚠️ Pending | medals table with unique index |
| `009_messages.sql` | ⚠️ Pending | messages table with recipient/tournament indexes |

> All migrations must be executed manually in Supabase SQL Editor.

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `src/app/medals/page.tsx` | Medal gallery page |
| `src/app/inbox/page.tsx` | Player inbox for host messages |
| `src/lib/messages.ts` | Message CRUD helpers |
| `src/lib/sounds.ts` | Web Audio API sound effects system |
| `supabase/migrations/007_question_started_at.sql` | Timer sync column |
| `supabase/migrations/008_medals.sql` | Medals table |
| `supabase/migrations/009_messages.sql` | Messages table |

## Files Modified This Session

| File | Changes |
|------|---------|
| `src/app/host/lobby/[code]/page.tsx` | Bug 1: try/catch, loading state, always navigates |
| `src/app/play/join/[code]/page.tsx` | Bug 2: passkey_on_join flow with wallet creation |
| `src/app/play/game/[code]/page.tsx` | Bug 3: timer sync; F19: sounds + mute; F21: penalty overhaul |
| `src/hooks/useGameSync.ts` | Bug 4: 5s polling fallback + channel error recovery |
| `src/app/claim/[code]/page.tsx` | Bug 5: sign-up first; F17: localStorage wallet save |
| `src/lib/gameLogic.ts` | Bug 3: write question_started_at on status update |
| `src/types/game.ts` | Bug 3: question_started_at field; F16: Medal types |
| `src/app/host/page.tsx` | Token selector UI |
| `src/components/JuggleBall.tsx` | F15: funny faces + impact bounce |
| `src/lib/globalPlayers.ts` | F16: evaluateMedals, getMedalsForPlayer, leaderboard medals |
| `src/app/page.tsx` | F18: full landing page redesign with 6 sections + scroll animations |
| `src/app/host/game/[code]/page.tsx` | F17: messaging; F20: airdrop card with Thirdweb transfers |
| `src/lib/i18n.ts` | All new keys: F15-F21 + landing + airdrop + sounds |

---

## i18n Status

| Screen | Uses `t()` | Status |
|--------|-----------|--------|
| Landing page `/` | ✅ Yes | Fully translated |
| Host page `/host` | ✅ Yes | Fully translated |
| Host lobby `/host/lobby/[code]` | ✅ Yes | Fully translated |
| Host game `/host/game/[code]` | ✅ Yes | Fully translated |
| Play page `/play` | ✅ Yes | Fully translated |
| Join page `/play/join/[code]` | ✅ Yes | Fully translated |
| Player lobby `/play/lobby/[code]` | ✅ Yes | Fully translated |
| Player game `/play/game/[code]` | ✅ Yes | Fully translated |
| Claim page `/claim/[code]` | ✅ Yes | Fully translated |
| FAQ page `/faq` | ✅ Yes | Fully translated |
| Medals page `/medals` | ✅ Yes | Fully translated |
| Inbox page `/inbox` | ✅ Yes | Fully translated |

> **100% i18n coverage.** All screens use `t()` with full EN/ES support.

---

## Known Bugs / Issues

1. **No actual AVAX transfer on claim** — contract deployed but host needs real AVAX on Fuji testnet
2. **Winner verification via sessionStorage** — should be server-side for security
3. **Goalkeeper logo as base64** — large logos stored directly in DB; should use Supabase Storage
4. **Token selector is UI-only** — only AVAX is functional; USDt/ETH/USDC marked "Coming Soon"
5. **Inbox wallet detection** — relies on localStorage; no auth system yet
6. **Medals page wallet detection** — same localStorage approach; no persistent auth
7. **Airdrop sends sequential transactions** — could fail mid-way; no rollback mechanism

---

## Pending Features / Roadmap

1. **Supabase Storage for logos** — Replace base64 with file upload
2. **AVAX mainnet deployment** — Switch from Fuji testnet to mainnet
3. **Dead code cleanup** — Old v1 single-player components + 3D PenaltyScene
4. **Deploy to Vercel** — Connect repo, add env vars, set `npm install --legacy-peer-deps`
5. **Spectator mode** — Allow non-players to watch the tournament live
6. **Tournament history** — Host can view past tournaments and results
7. **Multi-token prizes** — Enable USDt, ETH, USDC as prize currencies
8. **Player profiles** — Auth system with persistent player identity
9. **Host live dashboard** — Real-time player answers during active game
10. **Batch airdrop** — Single multicall transaction instead of sequential sends

---

## Tech Stack

Next.js 16 | React 18 | TypeScript | Tailwind CSS | Supabase Realtime | Thirdweb SDK | Avalanche Fuji | Web Audio API | Papaparse | Solidity 0.8.20 | Hardhat
