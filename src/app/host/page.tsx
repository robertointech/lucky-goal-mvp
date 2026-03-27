"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNearWallet } from "@/hooks/useNearWallet";
import { createTournament } from "@/lib/gameLogic";
import { prepareCreateTournament } from "@/lib/escrow";
import Papa from "papaparse";
import type { Question } from "@/types/game";
import { useLanguage } from "@/contexts/LanguageContext";

const PRIZE_PRESETS = ["0.05", "0.1", "0.25", "0.5", "1"];

export default function HostPage() {
  const { accountId, isConnected, connect } = useNearWallet();
  const router = useRouter();
  const { t } = useLanguage();
  const [prizeAmount, setPrizeAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState<Question[] | null>(null);
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passkey on join toggle
  const [passkeyOnJoin, setPasskeyOnJoin] = useState(false);

  // Goalkeeper logo
  const [goalkeeperLogo, setGoalkeeperLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError("");

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as string[][];
          // Skip header if it looks like one
          const startIdx = rows[0]?.[0]?.toLowerCase().includes("question") ? 1 : 0;
          const dataRows = rows.slice(startIdx);

          if (dataRows.length < 5) {
            setCsvError("At least 5 questions required. Found: " + dataRows.length);
            return;
          }

          const questions: Question[] = dataRows.map((row, i) => {
            if (row.length < 6) {
              throw new Error(`Row ${i + 1 + startIdx}: needs 6 columns (question, 4 options, answer)`);
            }

            const correctIndex = parseInt(row[5].trim(), 10);
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
              throw new Error(`Row ${i + 1 + startIdx}: correct_answer must be 0-3, received "${row[5].trim()}"`);
            }

            return {
              id: i + 1,
              question: row[0].trim(),
              options: [row[1].trim(), row[2].trim(), row[3].trim(), row[4].trim()],
              correctIndex,
              timeLimit: 20,
            };
          });

          setCustomQuestions(questions);
          setCsvError("");
        } catch (err) {
          setCsvError(err instanceof Error ? err.message : "Error parsing CSV");
          setCustomQuestions(null);
        }
      },
      error: () => {
        setCsvError("Error reading CSV file");
      },
    });

    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("Logo must be under 500KB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Logo must be a PNG or JPG image");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setGoalkeeperLogo(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!accountId) return;

    const prize = parseFloat(prizeAmount) || 0;
    if (prize <= 0) {
      setError("Prize must be greater than 0 AVAX.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tournament = await createTournament(
        accountId,
        prize,
        customQuestions,
        passkeyOnJoin,
        goalkeeperLogo
      );

      try {
        await prepareCreateTournament(tournament.code, prizeAmount);
      } catch (escrowErr: unknown) {
        const msg = escrowErr instanceof Error ? escrowErr.message : String(escrowErr);
        if (msg.includes("insufficient") || msg.includes("exceeds balance")) {
          setError(`Insufficient funds. You need at least ${prizeAmount} AVAX + gas.`);
          setLoading(false);
          return;
        }
        if (msg.includes("rejected") || msg.includes("denied")) {
          setError("Transaction rejected. Try again.");
          setLoading(false);
          return;
        }
        console.warn("Escrow deposit skipped:", escrowErr);
      }

      router.push(`/host/lobby/${tournament.code}`);
    } catch (err) {
      setError("Error creating tournament. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prizeNum = parseFloat(prizeAmount) || 0;
  const questionCount = customQuestions ? Math.min(customQuestions.length, 5) : 5;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#1a1a2e] relative overflow-hidden">
      <style>{styles}</style>

      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00FF88]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#00FF88]/10 text-[#00FF88] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#00FF88]/20">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            LUCKY GOAL
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            {t("host.title")}
          </h1>
          <p className="text-gray-400">
            {t("host.subtitle")}
          </p>
        </div>

        {!isConnected ? (
          /* Connect wallet state */
          <div className="host-card p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a2e] border border-gray-700/50 flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">&#128274;</span>
            </div>
            <h2 className="text-lg text-white font-bold mb-2">{t("host.connectWallet")}</h2>
            <p className="text-gray-400 text-sm mb-6">
              {t("host.connectDesc")}
            </p>
            <div className="flex justify-center">
              <button
                onClick={connect}
                className="font-bold px-7 py-3.5 rounded-xl text-base transition-all"
                style={{
                  background: "linear-gradient(135deg, #00FF88, #00CC6A)",
                  color: "#000",
                  boxShadow: "0 0 20px rgba(0,255,136,0.3)",
                }}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Prize Amount */}
            <div className="host-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{t("host.prize")}</h3>
              </div>

              {/* Token selector */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { symbol: "AVAX", icon: "🔺", active: true },
                  { symbol: "USDt", icon: "💲", active: false },
                  { symbol: "ETH", icon: "💎", active: false },
                  { symbol: "USDC", icon: "🔵", active: false },
                ].map((token) => (
                  <button
                    key={token.symbol}
                    disabled={!token.active}
                    className="relative flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-all"
                    style={{
                      background: token.active ? "rgba(0, 255, 136, 0.08)" : "#0D1117",
                      border: token.active ? "2px solid #00FF88" : "2px solid rgba(255,255,255,0.06)",
                      boxShadow: token.active ? "0 0 20px rgba(0,255,136,0.15), inset 0 0 12px rgba(0,255,136,0.05)" : "none",
                      opacity: token.active ? 1 : 0.5,
                      cursor: token.active ? "default" : "not-allowed",
                    }}
                  >
                    {!token.active && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-700 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap z-10 border border-gray-600">
                        SOON
                      </span>
                    )}
                    <span className="text-xl">{token.icon}</span>
                    <span className={`text-xs font-bold ${token.active ? "text-[#00FF88]" : "text-gray-500"}`}>
                      {token.symbol}
                    </span>
                  </button>
                ))}
              </div>

              {/* Big prize input */}
              <div className="relative mb-4">
                <input
                  type="number"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-[#1a1a2e] border-2 border-gray-700/50 rounded-xl px-5 py-4 text-white text-3xl font-black text-center focus:border-[#00FF88] focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">AVAX</span>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 flex-wrap">
                {PRIZE_PRESETS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setPrizeAmount(val)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      prizeAmount === val
                        ? "bg-[#00FF88] text-black"
                        : "bg-[#1a1a2e] text-gray-400 border border-gray-700/50 hover:border-[#00FF88]/50 hover:text-white"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Questions Upload */}
            <div className="host-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {t("host.customQuestions")}
                  <span className="text-gray-500 text-xs font-normal bg-gray-800 px-2 py-0.5 rounded-full">{t("host.optional")}</span>
                </h3>
              </div>

              <p className="text-gray-500 text-sm mb-2">
                {t("host.csvUploadDesc")}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-gray-600 text-xs font-mono">
                  {t("host.csvFormat")}
                </p>
                <button
                  onClick={() => {
                    const csv = `question,option1,option2,option3,option4,correct_answer\nWhat is the capital of France?,London,Paris,Berlin,Madrid,1\nHow many players in a soccer team?,9,10,11,12,2\nWhich planet is closest to the Sun?,Venus,Mercury,Earth,Mars,1`;
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "lucky-goal-template.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="shrink-0 text-[#00FF88] text-xs font-semibold hover:underline"
                >
                  {t("host.downloadTemplate")}
                </button>
              </div>

              {/* Upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />

              {!customQuestions ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-700/50 rounded-xl py-6 px-4 text-center transition-all hover:border-[#00FF88]/50 hover:bg-[#00FF88]/5 group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">&#128196;</div>
                  <p className="text-gray-400 text-sm font-medium group-hover:text-[#00FF88]">
                    {t("host.uploadCsv")}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    question, option1, option2, option3, option4, answer (0-3)
                  </p>
                </button>
              ) : (
                <div>
                  {/* Success header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00FF88] text-lg">&#9989;</span>
                      <span className="text-[#00FF88] text-sm font-bold">
                        {customQuestions.length} {t("host.questionsLoaded")}
                      </span>
                    </div>
                    <button
                      onClick={() => { setCustomQuestions(null); setCsvError(""); }}
                      className="text-gray-500 text-xs hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      {t("host.remove")}
                    </button>
                  </div>

                  {/* Questions preview */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                    {customQuestions.slice(0, 5).map((q, i) => (
                      <div
                        key={i}
                        className="bg-[#1a1a2e] border border-gray-800/50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                            style={{
                              background: "rgba(0, 255, 136, 0.15)",
                              color: "#00FF88",
                            }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {q.question}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                              {q.options.map((opt, j) => (
                                <span
                                  key={j}
                                  className={`text-xs ${
                                    j === q.correctIndex
                                      ? "text-[#00FF88] font-bold"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {j === q.correctIndex ? "* " : ""}{opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {customQuestions.length > 5 && (
                      <p className="text-gray-600 text-xs text-center py-1">
                        +{customQuestions.length - 5} more questions (first 5 will be used)
                      </p>
                    )}
                  </div>

                  {/* Change file button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-gray-500 text-xs hover:text-[#00FF88] transition-colors"
                  >
                    {t("host.changeFile")}
                  </button>
                </div>
              )}

              {csvError && (
                <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <p className="text-red-400 text-xs">{csvError}</p>
                </div>
              )}
            </div>

            {/* Passkey on Join Toggle */}
            <div className="host-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    {t("host.passkeyToggle")}
                    <span className="text-gray-500 text-xs font-normal bg-gray-800 px-2 py-0.5 rounded-full">{t("host.optional")}</span>
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {passkeyOnJoin
                      ? t("host.passkeyOn")
                      : t("host.passkeyOff")}
                  </p>
                </div>
                <button
                  onClick={() => setPasskeyOnJoin(!passkeyOnJoin)}
                  className="relative shrink-0 w-14 h-8 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: passkeyOnJoin ? "#00FF88" : "#374151",
                    boxShadow: passkeyOnJoin ? "0 0 15px rgba(0,255,136,0.3)" : "none",
                  }}
                >
                  <span
                    className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md"
                    style={{
                      left: passkeyOnJoin ? "calc(100% - 28px)" : "4px",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Goalkeeper Logo Upload */}
            <div className="host-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {t("host.goalkeeperLogo")}
                  <span className="text-gray-500 text-xs font-normal bg-gray-800 px-2 py-0.5 rounded-full">{t("host.optional")}</span>
                </h3>
              </div>

              <p className="text-gray-500 text-sm mb-4">
                {t("host.logoUploadDesc")}
              </p>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {!goalkeeperLogo ? (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-700/50 rounded-xl py-6 px-4 text-center transition-all hover:border-[#00FF88]/50 hover:bg-[#00FF88]/5 group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">&#128085;</div>
                  <p className="text-gray-400 text-sm font-medium group-hover:text-[#00FF88]">
                    {t("host.uploadLogo")}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">{t("host.maxSize")}</p>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#1a1a2e] border border-gray-700/50 flex items-center justify-center overflow-hidden">
                    <img src={goalkeeperLogo} alt="Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#00FF88] text-sm font-bold">{t("host.logoUploaded")}</p>
                    <p className="text-gray-500 text-xs">{t("host.logoDesc")}</p>
                  </div>
                  <button
                    onClick={() => setGoalkeeperLogo(null)}
                    className="text-gray-500 text-xs hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    {t("host.remove")}
                  </button>
                </div>
              )}
            </div>

            {/* Tournament Preview Card */}
            <div className="host-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF88]/5 rounded-full blur-[40px] pointer-events-none" />

              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="text-[#00FF88]">&#9889;</span>
                {t("host.preview")}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-xs">&#127918;</span>
                    <span className="text-gray-400 text-sm">{t("host.format")}</span>
                  </div>
                  <span className="text-white text-sm font-medium">{t("host.formatValue")}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-xs">&#10067;</span>
                    <span className="text-gray-400 text-sm">{t("host.questions")}</span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    {customQuestions
                      ? <span className="text-[#00FF88]">{questionCount} {t("host.custom")}</span>
                      : t("host.defaultQuestions")
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center text-xs">&#9201;</span>
                    <span className="text-gray-400 text-sm">{t("host.time")}</span>
                  </div>
                  <span className="text-white text-sm font-medium">{t("host.timeValue")}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center text-xs">&#9917;</span>
                    <span className="text-gray-400 text-sm">{t("host.penalties")}</span>
                  </div>
                  <span className="text-white text-sm font-medium">{t("host.penaltiesValue")}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-xs">&#11088;</span>
                    <span className="text-gray-400 text-sm">{t("host.scoring")}</span>
                  </div>
                  <span className="text-white text-sm font-medium">{t("host.scoringValue")}</span>
                </div>
              </div>

              {/* Prize highlight at bottom */}
              {prizeNum > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">{t("host.totalPrize")}</span>
                  <span className="text-[#00FF88] text-xl font-black">{prizeAmount} AVAX</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-center text-sm">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="host-btn w-full py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-[0.97] transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {t("host.creating")}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("host.createBtn")}
                  <span className="text-xl">&#9889;</span>
                </span>
              )}
            </button>

            {/* Connected wallet info */}
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                {t("host.connected")}: {accountId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
  .host-card {
    background: #0D1117;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
  }

  .host-btn {
    background: linear-gradient(135deg, #00FF88, #00CC6A);
    color: black;
    box-shadow: 0 0 25px rgba(0,255,136,0.3), 0 4px 15px rgba(0,0,0,0.3);
  }
  .host-btn:hover:not(:disabled) {
    box-shadow: 0 0 35px rgba(0,255,136,0.5), 0 4px 20px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 136, 0.2);
    border-radius: 2px;
  }
`;
