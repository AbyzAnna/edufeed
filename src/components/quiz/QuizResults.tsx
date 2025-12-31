"use client";

import {
  CheckCircle,
  XCircle,
  Trophy,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";

interface QuizResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResultsProps {
  score: number;
  maxScore: number;
  percentage: number;
  results: QuizResult[];
  timeSpent?: number;
  onRetry: () => void;
  onBack: () => void;
}

export default function QuizResults({
  score,
  maxScore,
  percentage,
  results,
  timeSpent,
  onRetry,
  onBack,
}: QuizResultsProps) {
  const passed = percentage >= 70;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeInfo = () => {
    if (percentage >= 90) return { grade: "A", color: "text-green-400", message: "Excellent!" };
    if (percentage >= 80) return { grade: "B", color: "text-blue-400", message: "Great job!" };
    if (percentage >= 70) return { grade: "C", color: "text-yellow-400", message: "Good work!" };
    if (percentage >= 60) return { grade: "D", color: "text-orange-400", message: "Keep practicing!" };
    return { grade: "F", color: "text-red-400", message: "Review the material and try again" };
  };

  const gradeInfo = getGradeInfo();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score Card */}
      <div className="card p-8 text-center mb-8">
        <div
          className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
            passed
              ? "bg-gradient-to-br from-green-600 to-emerald-600"
              : "bg-gradient-to-br from-orange-600 to-red-600"
          }`}
        >
          {passed ? (
            <Trophy className="w-12 h-12" />
          ) : (
            <RefreshCw className="w-12 h-12" />
          )}
        </div>

        <h2 className="text-3xl font-bold mb-2">
          {score} / {maxScore}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`text-5xl font-bold ${gradeInfo.color}`}>
            {percentage}%
          </span>
          <span className={`text-2xl font-medium ${gradeInfo.color}`}>
            ({gradeInfo.grade})
          </span>
        </div>
        <p className="text-gray-400 text-lg">{gradeInfo.message}</p>

        {timeSpent && (
          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Completed in {formatTime(timeSpent)}</span>
          </div>
        )}
      </div>

      {/* Results breakdown */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold">Review Answers</h3>

        {results.map((result, index) => (
          <div
            key={result.questionId}
            className={`card p-4 border-l-4 ${
              result.isCorrect ? "border-l-green-500" : "border-l-red-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  result.isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                }`}
              >
                {result.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium mb-2">
                  {index + 1}. {result.questionText}
                </p>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Your answer:</span>
                    <span
                      className={
                        result.isCorrect ? "text-green-400" : "text-red-400"
                      }
                    >
                      {result.userAnswer || "No answer"}
                    </span>
                  </div>

                  {!result.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Correct answer:</span>
                      <span className="text-green-400">
                        {result.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {result.explanation && (
                  <div className="mt-3 p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                    <span className="font-medium text-gray-400">
                      Explanation:{" "}
                    </span>
                    {result.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors font-medium"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
        >
          Back to Study Hub
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
