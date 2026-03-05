"use client";

import { useState, useEffect } from "react";
import { triviaQuestions } from "@/lib/questions";

interface TriviaProps {
  questionIndex: number;
  onAnswer: (isCorrect: boolean) => void;
}

export default function Trivia({ questionIndex, onAnswer }: TriviaProps) {
  const question = triviaQuestions[questionIndex];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, showResult]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showResult) {
      handleSubmit(-1); // -1 means no answer (incorrect)
    }
  }, [timeLeft, showResult]);

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = (forcedIndex?: number) => {
    const answerIndex = forcedIndex !== undefined ? forcedIndex : selectedIndex;
    if (answerIndex === null && forcedIndex === undefined) return;

    setShowResult(true);
    const isCorrect = answerIndex === question.correctIndex;

    // Wait a moment to show result, then proceed
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedIndex(null);
      setShowResult(false);
      setTimeLeft(20);
    }, 1500);
  };

  // Calculate timer color
  const timerColor =
    timeLeft > 10
      ? "text-lucky-green"
      : timeLeft > 5
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-400 text-sm">
          Pregunta {questionIndex + 1} de {triviaQuestions.length}
        </div>
        <div className={`text-2xl font-bold ${timerColor}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
        <div
          className="bg-lucky-green h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((questionIndex + 1) / triviaQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-center">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 flex-1">
        {question.options.map((option, index) => {
          let buttonClass = "btn-option";

          if (showResult) {
            if (index === question.correctIndex) {
              buttonClass += " correct";
            } else if (index === selectedIndex && index !== question.correctIndex) {
              buttonClass += " incorrect";
            }
          } else if (index === selectedIndex) {
            buttonClass += " border-lucky-green";
          }

          return (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              className={buttonClass}
              disabled={showResult}
            >
              <span className="font-bold text-lucky-green mr-3">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!showResult && (
        <button
          onClick={() => handleSubmit()}
          disabled={selectedIndex === null}
          className={`btn-primary mt-6 w-full ${
            selectedIndex === null ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Confirmar Respuesta
        </button>
      )}

      {/* Result feedback */}
      {showResult && (
        <div className="mt-6 text-center">
          {selectedIndex === question.correctIndex ? (
            <div className="text-lucky-green text-xl font-bold">
              ✅ ¡Correcto! Ahora patea...
            </div>
          ) : (
            <div className="text-red-500 text-xl font-bold">
              ❌ Incorrecto. Igual puedes patear...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
