export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

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
 */
export function getGameQuestions(tournamentCode: string): Question[] {
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
  // --- Deportes ---
  {
    id: 1,
    question: "¿Cuántos jugadores tiene un equipo de fútbol en el campo?",
    options: ["9", "10", "11", "12"],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "¿En qué país se celebró el Mundial 2022?",
    options: ["Rusia", "Brasil", "Qatar", "Japón"],
    correctIndex: 2,
  },
  {
    id: 3,
    question: "¿Cuánto dura un partido de fútbol reglamentario?",
    options: ["80 minutos", "90 minutos", "100 minutos", "120 minutos"],
    correctIndex: 1,
  },
  {
    id: 4,
    question: "¿Qué jugador ha ganado más Balones de Oro?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Pelé", "Maradona"],
    correctIndex: 1,
  },
  {
    id: 5,
    question: "¿Desde qué distancia se cobra un penalti?",
    options: ["9 metros", "11 metros", "12 metros", "15 metros"],
    correctIndex: 1,
  },
  {
    id: 6,
    question: "¿Qué selección ha ganado más Copas del Mundo?",
    options: ["Alemania", "Argentina", "Brasil", "Italia"],
    correctIndex: 2,
  },
  {
    id: 7,
    question: "¿En qué deporte se usa un shuttlecock (gallito)?",
    options: ["Tenis de mesa", "Bádminton", "Squash", "Voleibol"],
    correctIndex: 1,
  },
  // --- Cultura general ---
  {
    id: 8,
    question: "¿Cuál es el océano más grande del mundo?",
    options: ["Atlántico", "Índico", "Pacífico", "Ártico"],
    correctIndex: 2,
  },
  {
    id: 9,
    question: "¿En qué año llegó el hombre a la Luna?",
    options: ["1965", "1969", "1972", "1975"],
    correctIndex: 1,
  },
  {
    id: 10,
    question: "¿Quién pintó la Mona Lisa?",
    options: ["Miguel Ángel", "Rafael", "Leonardo da Vinci", "Botticelli"],
    correctIndex: 2,
  },
  // --- Ciencia ---
  {
    id: 11,
    question: "¿Cuál es el planeta más grande del sistema solar?",
    options: ["Saturno", "Neptuno", "Júpiter", "Urano"],
    correctIndex: 2,
  },
  {
    id: 12,
    question: "¿Qué gas necesitan las plantas para la fotosíntesis?",
    options: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Hidrógeno"],
    correctIndex: 2,
  },
  {
    id: 13,
    question: "¿Cuántos huesos tiene el cuerpo humano adulto?",
    options: ["186", "206", "226", "256"],
    correctIndex: 1,
  },
  {
    id: 14,
    question: "¿Cuál es el elemento químico más abundante en el universo?",
    options: ["Oxígeno", "Helio", "Hidrógeno", "Carbono"],
    correctIndex: 2,
  },
  // --- Tecnología ---
  {
    id: 15,
    question: "¿En qué año se lanzó el primer iPhone?",
    options: ["2005", "2006", "2007", "2008"],
    correctIndex: 2,
  },
  {
    id: 16,
    question: "¿Qué significa 'HTTP' en internet?",
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
    question: "¿Quién es considerado el padre de la computación?",
    options: ["Steve Jobs", "Bill Gates", "Alan Turing", "Tim Berners-Lee"],
    correctIndex: 2,
  },
  // --- Geografía ---
  {
    id: 18,
    question: "¿Cuál es el país más pequeño del mundo?",
    options: ["Mónaco", "Vaticano", "San Marino", "Liechtenstein"],
    correctIndex: 1,
  },
  {
    id: 19,
    question: "¿En qué continente está Egipto?",
    options: ["Asia", "Europa", "África", "Oceanía"],
    correctIndex: 2,
  },
  {
    id: 20,
    question: "¿Cuál es el río más largo del mundo?",
    options: ["Misisipi", "Amazonas", "Nilo", "Yangtsé"],
    correctIndex: 2,
  },
];
