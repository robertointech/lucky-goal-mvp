export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export const triviaQuestions: Question[] = [
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
];
