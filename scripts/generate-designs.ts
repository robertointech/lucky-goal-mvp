import { config } from "dotenv";
config({ path: ".env.local" });

import { stitch } from "@google/stitch-sdk";
import { writeFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(import.meta.dirname!, "..", "designs", "stitch-output");

const screens = [
  {
    name: "home",
    prompt:
      "Mobile-first home screen for a blockchain trivia + penalty kick game called Lucky Goal. Dark theme (#1a1a2e background), football/soccer aesthetic, neon green (#00FF88) accents on dark background. Show: logo area with soccer ball icon, 'Create Tournament' primary button (green gradient), 'Join Game' secondary button, global leaderboard preview showing top 3 players with avatars and scores, and a 'Connect Wallet' button at the top right. Energetic, gaming feel like Kahoot meets Web3. Card backgrounds should be #0D1117. Modern glassmorphism cards with subtle borders.",
  },
  {
    name: "lobby",
    prompt:
      "Mobile tournament lobby screen for Lucky Goal game. Dark theme (#1a1a2e background, #0D1117 cards). Neon green (#00FF88) accents throughout. Show: tournament code 'ABC123' prominently at top in monospace font, large QR code in center with green glow effect, player count badge '5/20 joined', scrollable list of joined players each with emoji avatar and nickname, green pulse animation on waiting indicator, 'Share on WhatsApp' green button and 'Share on Twitter' blue button side by side, and a large 'Start Game' button at bottom for the host. Clean, modern, mobile-first.",
  },
  {
    name: "trivia",
    prompt:
      "Mobile trivia question screen for Lucky Goal game. Dark theme (#1a1a2e). Show: circular countdown timer (15 seconds remaining) at top center with green ring that depletes, question number '3/5' indicator, question text 'What country won the 2022 FIFA World Cup?' in large white text, 4 answer option buttons in 2x2 grid with Kahoot-style colors (red #E21B3C for A, blue #1368CE for B, yellow #D89E00 for C, green #26890C for D), each with shape icon (triangle, diamond, circle, square). Player score '250 pts' at bottom. Urgent, competitive gaming feel with subtle glow effects.",
  },
  {
    name: "results",
    prompt:
      "Mobile tournament results/ranking screen for Lucky Goal game. Dark celebratory theme (#1a1a2e background). Show: winner celebration at top with large trophy emoji, winner name 'Carlos' with crown icon and golden glow, animated podium showing top 3 players (gold/silver/bronze) with their emoji avatars and scores, full ranking list below with position numbers and score bars, each player showing correct answers count. Green (#00FF88) confetti particles scattered. 'Claim Prize' prominent green button, 'Share Results' button, 'New Tournament' button. Premium, celebratory feel.",
  },
];

async function main() {
  console.log("Creating Stitch project for Lucky Goal designs...\n");

  const project = await stitch.createProject("Lucky Goal MVP Designs");
  console.log(`Project created: ${project.id}\n`);

  for (const screen of screens) {
    console.log(`Generating: ${screen.name}...`);
    try {
      const generated = await project.generate(screen.prompt, "MOBILE", "GEMINI_3_PRO");
      console.log(`  Screen ID: ${generated.id}`);

      const html = await generated.getHtml();
      const outPath = join(OUTPUT_DIR, `${screen.name}.html`);
      writeFileSync(outPath, html, "utf-8");
      console.log(`  Saved: ${outPath}`);

      try {
        const imageUrl = await generated.getImage();
        const imgPath = join(OUTPUT_DIR, `${screen.name}-preview.txt`);
        writeFileSync(imgPath, imageUrl, "utf-8");
        console.log(`  Preview URL saved: ${imgPath}`);
      } catch {
        console.log(`  (no preview image available)`);
      }

      console.log();
    } catch (err) {
      console.error(`  Error generating ${screen.name}:`, err);
    }
  }

  console.log("Done! Check designs/stitch-output/ for results.");
  await stitch.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
