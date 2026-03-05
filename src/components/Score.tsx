"use client";

interface ScoreProps {
  goals: number;
  totalPenalties: number;
  correctAnswers: number;
  totalQuestions: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function Score({
  goals,
  totalPenalties,
  correctAnswers,
  totalQuestions,
  onPlayAgain,
  onGoHome,
}: ScoreProps) {
  const percentage = Math.round((goals / totalPenalties) * 100);

  // Determine performance message
  let performanceEmoji = "👏";
  let performanceMessage = "¡Buen intento!";

  if (percentage === 100) {
    performanceEmoji = "🏆";
    performanceMessage = "¡PERFECTO!";
  } else if (percentage >= 80) {
    performanceEmoji = "🌟";
    performanceMessage = "¡Excelente!";
  } else if (percentage >= 60) {
    performanceEmoji = "💪";
    performanceMessage = "¡Muy bien!";
  } else if (percentage >= 40) {
    performanceEmoji = "👍";
    performanceMessage = "¡Sigue practicando!";
  } else {
    performanceEmoji = "😅";
    performanceMessage = "¡La próxima será mejor!";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Performance header */}
      <div className="text-6xl mb-4">{performanceEmoji}</div>
      <h1 className="text-3xl font-bold text-white mb-2">{performanceMessage}</h1>

      {/* Score card */}
      <div className="card w-full max-w-sm mt-8">
        {/* Goals */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-lucky-green">
            {goals}/{totalPenalties}
          </div>
          <div className="text-gray-400 mt-1">Goles anotados</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-gray-500 text-sm">Respuestas correctas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{percentage}%</div>
            <div className="text-gray-500 text-sm">Efectividad</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm mt-8 space-y-3">
        <button onClick={onPlayAgain} className="btn-primary w-full text-lg">
          🔄 Jugar de nuevo
        </button>
        <button
          onClick={onGoHome}
          className="w-full bg-transparent border border-gray-600 text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
        >
          🏠 Volver al inicio
        </button>
      </div>

      {/* Share hint */}
      <p className="text-gray-600 text-sm mt-8 text-center">
        Anoté {goals} de {totalPenalties} penales en Lucky Goal ⚽
      </p>
    </div>
  );
}
