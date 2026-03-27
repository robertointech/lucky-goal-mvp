"use client";

import { useNearWallet } from "@/hooks/useNearWallet";
import Link from "next/link";

interface HomeProps {
  account: { address: string };
  onStartGame: () => void;
}

export default function Home({ account, onStartGame }: HomeProps) {
  const { connect } = useNearWallet();

  const shortAddress = account.address
    ? account.address.length > 20
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
      : account.address
    : "";

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden">
      <style>{styles}</style>

      {/* Top NavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-gradient-to-b from-surface-container-low to-transparent shadow-[0_10px_30px_rgba(0,253,135,0.05)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#9917;</span>
          <span className="text-xl font-black tracking-tighter text-primary-container uppercase font-headline">
            LUCKY GOAL
          </span>
        </div>
        <button
          onClick={connect}
          className="bg-primary-container text-on-primary px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider font-body active:scale-95 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,253,135,0.4)]"
        >
          {shortAddress || "Connect Wallet"}
        </button>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-5 min-h-screen stadium-overlay">
        {/* Hero Section */}
        <header className="relative mb-12 flex flex-col items-center text-center">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />

          <h1 className="font-headline font-bold text-5xl leading-tight tracking-tighter text-primary-container mb-4 uppercase italic">
            WIN BIG IN <br /> THE ARENA
          </h1>
          <p className="font-body text-on-surface-variant text-base max-w-[280px] leading-relaxed mb-8">
            Master the ultimate football trivia challenge and dominate the penalty kick shootout to claim rewards.
          </p>

          <div className="w-full max-w-sm flex flex-col gap-4">
            <Link href="/host">
              <button className="w-full kinetic-gradient text-on-primary py-5 rounded-xl font-headline font-black text-xl uppercase tracking-widest shadow-[0_10px_40px_rgba(0,253,135,0.2)] active:scale-95 transition-transform hover:shadow-[0_0_20px_rgba(0,253,135,0.4)]">
                CREATE TOURNAMENT
              </button>
            </Link>
            <Link href="/play">
              <button className="w-full glass-card border border-outline-variant/15 text-primary py-5 rounded-xl font-headline font-bold text-xl uppercase tracking-widest active:scale-95 transition-transform">
                JOIN GAME
              </button>
            </Link>
          </div>
        </header>

        {/* Live Match Card */}
        <section className="mb-12 max-w-sm mx-auto">
          <div className="bg-surface-container-low p-1 rounded-2xl">
            <div className="glass-card border border-outline-variant/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                    Live Match
                  </span>
                  <h2 className="font-headline font-bold text-2xl text-on-surface">
                    TRIVIA FINALS
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-on-surface-variant text-[10px] uppercase font-bold block mb-1">
                    Prize Pool
                  </span>
                  <span className="text-primary-container font-headline font-black text-xl">
                    0.5 AVAX
                  </span>
                </div>
              </div>

              {/* Power Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
                  <span>Power Meter</span>
                  <span className="text-primary">Perfect Strike Zone</span>
                </div>
                <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden flex p-0.5">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-tertiary-container via-primary-container to-tertiary-container opacity-90 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-12 bg-white/40 blur-[2px]" />
                    <div className="absolute top-0 left-[55%] h-full w-1 bg-white shadow-[0_0_10px_#fff]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="mb-8 max-w-sm mx-auto">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-headline font-bold text-2xl uppercase tracking-tight text-on-surface flex items-center gap-2">
              <span className="text-primary">&#127942;</span>
              TOP STRIKERS
            </h3>
            <Link href="/medals" className="text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { rank: 1, name: "Waiting...", score: "---", isTop: true },
              { rank: 2, name: "for players", score: "---", isTop: false },
              { rank: 3, name: "to join!", score: "---", isTop: false },
            ].map((player) => (
              <div
                key={player.rank}
                className="bg-lucky-card border border-outline-variant/20 rounded-xl p-4 flex items-center justify-between group hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      player.isTop
                        ? "border-2 border-primary shadow-[0_0_15px_rgba(0,253,135,0.2)]"
                        : "border-2 border-outline-variant/30"
                    } bg-surface-container-highest`}>
                      {player.rank === 1 ? "&#9917;" : player.rank === 2 ? "&#127941;" : "&#127944;"}
                    </div>
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      player.isTop
                        ? "bg-primary-container text-on-primary"
                        : "bg-surface-container-highest text-on-surface"
                    }`}>
                      {player.rank}
                    </div>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                      {player.name}
                    </p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Global Rank: #{String(player.rank).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-headline font-black text-xl tracking-tight ${
                    player.isTop ? "text-primary-container" : "text-on-surface"
                  }`}>
                    {player.score}
                  </p>
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                    SCORE
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Feature Grid */}
        <section className="grid grid-cols-2 gap-4 mb-12 max-w-sm mx-auto">
          <div className="col-span-1 bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 flex flex-col justify-between aspect-square">
            <span className="text-primary text-3xl">&#10067;</span>
            <div>
              <h4 className="font-headline font-bold text-on-surface text-lg leading-tight uppercase">
                Rapid Trivia
              </h4>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1">
                Answer fast to charge your kicker.
              </p>
            </div>
          </div>
          <div className="col-span-1 bg-primary-container/5 rounded-2xl p-5 border border-primary/20 flex flex-col justify-between aspect-square">
            <span className="text-primary text-3xl">&#127919;</span>
            <div>
              <h4 className="font-headline font-bold text-primary text-lg leading-tight uppercase">
                Global Arenas
              </h4>
              <p className="text-[10px] text-on-surface-variant font-medium mt-1">
                Tournament modes for every skill level.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom NavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-low/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,253,135,0.08)] rounded-t-3xl">
        <button
          onClick={onStartGame}
          className="flex flex-col items-center justify-center text-primary-container bg-primary-container/10 rounded-xl px-4 py-1 active:scale-90 transition-all"
        >
          <span className="text-xl">&#127918;</span>
          <span className="font-body text-[10px] uppercase font-bold tracking-widest mt-1">Play</span>
        </button>
        <Link href="/medals" className="flex flex-col items-center justify-center text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100 active:scale-90 transition-all">
          <span className="text-xl">&#127942;</span>
          <span className="font-body text-[10px] uppercase font-bold tracking-widest mt-1">Medals</span>
        </Link>
        <Link href="/inbox" className="flex flex-col items-center justify-center text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100 active:scale-90 transition-all">
          <span className="text-xl">&#128172;</span>
          <span className="font-body text-[10px] uppercase font-bold tracking-widest mt-1">Inbox</span>
        </Link>
        <Link href="/faq" className="flex flex-col items-center justify-center text-on-surface-variant opacity-60 hover:text-primary hover:opacity-100 active:scale-90 transition-all">
          <span className="text-xl">&#128218;</span>
          <span className="font-body text-[10px] uppercase font-bold tracking-widest mt-1">FAQ</span>
        </Link>
      </nav>
    </div>
  );
}

const styles = `
  .glass-card {
    background: rgba(32, 38, 47, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .kinetic-gradient {
    background: linear-gradient(135deg, #a4ffb9 0%, #00fd87 100%);
  }
  .stadium-overlay {
    background: radial-gradient(circle at 50% -20%, rgba(0, 253, 135, 0.15) 0%, transparent 70%);
  }
`;
