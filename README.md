# ⚽ Lucky Goal MVP

Trivia + Penalty Kicks = Engagement. Built on Avalanche.

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

### 3. Open in browser

```
http://localhost:3000
```

## 📱 Test on Mobile

1. Find your local IP: `ipconfig getifaddr en0` (Mac)
2. Open on phone: `http://YOUR_IP:3000`
3. Both devices must be on same WiFi

## 🛠 Tech Stack

- **Framework:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Thirdweb Embedded Wallets
- **Blockchain:** Avalanche Fuji (Testnet)

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx    # Main layout with ThirdwebProvider
│   ├── page.tsx      # Game state management
│   └── globals.css   # Tailwind + custom styles
├── components/
│   ├── Login.tsx     # Login screen with Thirdweb
│   ├── Home.tsx      # Home screen post-login
│   ├── Trivia.tsx    # Trivia questions
│   ├── PenaltyKick.tsx # Penalty kick mechanic
│   └── Score.tsx     # Results screen
└── lib/
    ├── thirdweb.ts   # Thirdweb client config
    └── questions.ts  # Trivia questions data
```

## 🎮 Game Flow

1. **Login** → Email or Google (creates smart wallet)
2. **Home** → See wallet, tap "JUGAR"
3. **Trivia** → Answer 5 questions (20s each)
4. **Penalty** → Kick after each answer
5. **Score** → See results, play again

## ⚙️ Environment Variables

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
```

## 🚀 Deploy to Vercel

```bash
vercel
```

## 📝 License

MIT
