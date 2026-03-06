# Lucky Goal

**Multiplayer trivia + penalty kicks game on Avalanche.** Host tournaments on a big screen while players compete from their phones — Kahoot-style with Web3 prizes.

> Built for B2B events, conferences, and watch parties. The host projects the game; players join with a PIN code and compete for AVAX prizes.

![Lucky Goal Banner](./artifacts/banner-placeholder.png)

## How It Works

1. **Host creates a tournament** on desktop/projector, deposits AVAX as prize
2. **Players scan QR / enter PIN** on their phones to join the lobby
3. **5 trivia rounds** — each with a question + penalty kick shootout
4. **Winner claims the prize** via Passkey wallet (no seed phrase needed)

## Screenshots

| Host Lobby | Player Game | Claim Prize |
|:---:|:---:|:---:|
| ![lobby](./artifacts/screenshot-lobby.png) | ![game](./artifacts/screenshot-game.png) | ![claim](./artifacts/screenshot-claim.png) |

> _Replace with actual screenshots_

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 18, TypeScript |
| Styling | Tailwind CSS, CSS animations |
| 3D | React Three Fiber (penalty kicks) |
| Realtime | Supabase Realtime (game sync) |
| Database | Supabase (PostgreSQL) |
| Blockchain | Avalanche C-Chain (Fuji testnet) |
| Wallets | Thirdweb SDK + Passkey wallets |
| Smart Contract | Solidity 0.8.20 (Hardhat) |

## Architecture

```
┌─────────────────┐     Supabase Realtime     ┌──────────────────┐
│   HOST (desktop) │◄────────────────────────►│  PLAYERS (mobile) │
│   /host/*        │     status updates        │  /play/*          │
└────────┬─────────┘                           └────────┬──────────┘
         │                                              │
         │  Thirdweb SDK                                │  Passkey wallet
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Avalanche Fuji Testnet                        │
│           LuckyGoalEscrow (prize deposit + claim)               │
└─────────────────────────────────────────────────────────────────┘
```

**Game flow:** Host controls all phase transitions (question → penalty → results) via Supabase status updates. Players react in real-time. Answer evaluation is local for instant feedback; scores are submitted to the DB.

**Penalty logic:** Wrong trivia answer = 0% goal chance. Correct answer = random goalkeeper direction + 30% save chance if same direction picked.

## Smart Contract

**LuckyGoalEscrow** — deployed on Avalanche Fuji testnet

| | |
|---|---|
| Address | [`0xd638D0f20B3b7a6FDaf6eba5753b05Ad1695012F`](https://testnet.snowtrace.io/address/0xd638D0f20B3b7a6FDaf6eba5753b05Ad1695012F) |
| Network | Avalanche Fuji (Chain ID 43113) |
| Solidity | 0.8.20 |
| Source | `src/contracts/LuckyGoalEscrow.sol` |

**Functions:**
- `createTournament(code)` — payable, deposits AVAX prize
- `claimPrize(code, winner)` — transfers prize to winner's wallet
- `getTournament(code)` — view tournament state

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_ESCROW_CONTRACT=0xd638D0f20B3b7a6FDaf6eba5753b05Ad1695012F
DEPLOYER_PRIVATE_KEY=your_deployer_key  # only for contract deployment
```

### Install & Run

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> `--legacy-peer-deps` is required because React Three Fiber v9 expects React 19, but the project uses React 18.

### Test on Mobile

1. Find your local IP: `ipconfig getifaddr en0` (Mac)
2. Open on phone: `http://YOUR_IP:3000`
3. Both devices must be on same WiFi

### Deploy Contract (optional)

```bash
npx hardhat run scripts/deploy.ts --network fuji
```

## Project Structure

```
src/
├── app/
│   ├── host/              # Host screens (desktop/projector)
│   │   ├── page.tsx       # Create tournament
│   │   ├── lobby/[code]/  # QR + waiting room
│   │   └── game/[code]/   # Game flow (projector view)
│   ├── play/              # Player screens (mobile)
│   │   ├── page.tsx       # Enter PIN
│   │   ├── join/[code]/   # Choose avatar + nickname
│   │   ├── lobby/[code]/  # Waiting room
│   │   └── game/[code]/   # Game flow (mobile view)
│   └── claim/[code]/      # Winner claims prize
├── lib/
│   ├── gameLogic.ts       # Supabase CRUD operations
│   ├── escrow.ts          # Thirdweb contract helpers
│   ├── questions.ts       # 20 trivia questions
│   └── thirdweb.ts        # Thirdweb client config
├── hooks/
│   ├── useGameSync.ts     # Supabase Realtime subscription
│   └── useCountdown.ts    # Timer hook
├── components/
│   └── PenaltyScene.tsx   # React Three Fiber 3D scene
├── contracts/
│   └── LuckyGoalEscrow.sol
└── types/
    └── game.ts            # TypeScript interfaces
```

## Demo

[Watch the demo video](https://youtube.com/placeholder)

## License

MIT
