// Re-export Question from the canonical type definition
import type { Question } from "@/types/game";
export type { Question };

export const QUESTIONS_PER_GAME = 5;

// Simple seeded PRNG (mulberry32) — deterministic shuffle from tournament code
function seededRng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Get the questions for a specific tournament. Uses the tournament code
 * as seed so host and all players get the same set in the same order.
 * If customQuestions are provided, uses those instead of defaults.
 */
export function getGameQuestions(tournamentCode: string, customQuestions?: Question[] | null): Question[] {
  // If custom questions exist, use them (take first QUESTIONS_PER_GAME)
  if (customQuestions && customQuestions.length > 0) {
    return customQuestions.slice(0, QUESTIONS_PER_GAME).map((q, i) => ({
      ...q,
      id: q.id ?? i + 1,
      timeLimit: q.timeLimit ?? 20,
    }));
  }

  const rng = seededRng(hashCode(tournamentCode));
  const indices = triviaQuestions.map((_, i) => i);
  // Fisher-Yates shuffle with seeded RNG
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, QUESTIONS_PER_GAME).map((i) => triviaQuestions[i]);
}

export const triviaQuestions: Question[] = [
  // --- Sports ---
  {
    id: 1,
    question: "How many players does a soccer team have on the field?",
    options: ["9", "10", "11", "12"],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "In which country was the 2022 World Cup held?",
    options: ["Russia", "Brazil", "Qatar", "Japan"],
    correctIndex: 2,
  },
  {
    id: 3,
    question: "How long is a regulation soccer match?",
    options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
    correctIndex: 1,
  },
  {
    id: 4,
    question: "Which player has won the most Ballon d'Or awards?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Pele", "Maradona"],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "From what distance is a penalty kick taken?",
    options: ["9 meters", "11 meters", "12 meters", "15 meters"],
    correctIndex: 1,
  },
  {
    id: 6,
    question: "Which national team has won the most World Cups?",
    options: ["Germany", "Argentina", "Brazil", "Italy"],
    correctIndex: 2,
  },
  {
    id: 7,
    question: "In which sport is a shuttlecock used?",
    options: ["Table Tennis", "Badminton", "Squash", "Volleyball"],
    correctIndex: 1,
  },
  // --- General Knowledge ---
  {
    id: 8,
    question: "What is the largest ocean in the world?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
  },
  {
    id: 9,
    question: "In what year did man first walk on the Moon?",
    options: ["1965", "1969", "1972", "1975"],
    correctIndex: 1,
  },
  {
    id: 10,
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli"],
    correctIndex: 2,
  },
  // --- Science ---
  {
    id: 11,
    question: "What is the largest planet in the solar system?",
    options: ["Saturn", "Neptune", "Jupiter", "Uranus"],
    correctIndex: 2,
  },
  {
    id: 12,
    question: "What gas do plants need for photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    correctIndex: 2,
  },
  {
    id: 13,
    question: "How many bones does the adult human body have?",
    options: ["186", "206", "226", "256"],
    correctIndex: 1,
  },
  {
    id: 14,
    question: "What is the most abundant chemical element in the universe?",
    options: ["Oxygen", "Helium", "Hydrogen", "Carbon"],
    correctIndex: 2,
  },
  // --- Technology ---
  {
    id: 15,
    question: "In what year was the first iPhone released?",
    options: ["2005", "2006", "2007", "2008"],
    correctIndex: 2,
  },
  {
    id: 16,
    question: "What does 'HTTP' stand for?",
    options: [
      "HyperText Transfer Protocol",
      "High Tech Transfer Program",
      "Home Tool Transfer Protocol",
      "Hyper Transaction Text Program",
    ],
    correctIndex: 0,
  },
  {
    id: 17,
    question: "Who is considered the father of computing?",
    options: ["Steve Jobs", "Bill Gates", "Alan Turing", "Tim Berners-Lee"],
    correctIndex: 2,
  },
  // --- Geography ---
  {
    id: 18,
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctIndex: 1,
  },
  {
    id: 19,
    question: "On which continent is Egypt?",
    options: ["Asia", "Europe", "Africa", "Oceania"],
    correctIndex: 2,
  },
  {
    id: 20,
    question: "What is the longest river in the world?",
    options: ["Mississippi", "Amazon", "Nile", "Yangtze"],
    correctIndex: 2,
  },
];
