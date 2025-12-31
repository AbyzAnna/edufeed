"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, HelpCircle, Play } from "lucide-react";
import QuizTaker from "@/components/quiz/QuizTaker";
import QuizResults from "@/components/quiz/QuizResults";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  options: QuizOption[];
  order: number;
}

interface QuizData {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  timeLimit?: number | null;
  questions: QuizQuestion[];
  bestAttempt?: {
    score: number;
    maxScore: number;
    percentage: number;
  };
}

interface QuizResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface SubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  results: QuizResult[];
  passed: boolean;
}

type ViewState = "start" | "taking" | "results";

export default function QuizPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>("start");
  const [results, setResults] = useState<SubmitResult | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && quizId) {
      fetchQuiz();
    }
  }, [user, quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const data = await res.json();
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading quiz");
    } finally {
      setPageLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      setPageLoading(true);
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to start quiz");

      const data = await res.json();
      setAttemptId(data.attemptId);
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              questions: data.quiz.questions,
            }
          : null
      );
      setViewState("taking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error starting quiz");
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = useCallback(
    async (
      answers: { questionId: string; answer: string; timeSpent?: number }[],
      totalTimeSpent: number
    ) => {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId,
            answers,
            totalTimeSpent,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit quiz");

        const data = await res.json();
        setResults(data);
        setViewState("results");
      } catch (err) {
        console.error("Error submitting quiz:", err);
        setError("Failed to submit quiz");
      }
    },
    [quizId, attemptId]
  );

  const handleRetry = () => {
    setAttemptId(null);
    setResults(null);
    setViewState("start");
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to Take Quiz</h2>
          <button
            onClick={() => router.push("/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/study")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Study Hub
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz not found</h2>
          <button
            onClick={() => router.push("/study")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Study Hub
          </button>
        </div>
      </div>
    );
  }

  // Start screen
  if (viewState === "start") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Quiz Info Card */}
          <div className="card p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-400 mb-6">{quiz.description}</p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <div className="px-4 py-2 bg-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Questions</span>
                <p className="font-semibold">{quiz.questions.length}</p>
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-lg">
                <span className="text-gray-400 text-sm">Difficulty</span>
                <p
                  className={`font-semibold capitalize ${
                    quiz.difficulty === "EASY"
                      ? "text-green-400"
                      : quiz.difficulty === "MEDIUM"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {quiz.difficulty.toLowerCase()}
                </p>
              </div>
              {quiz.timeLimit && (
                <div className="px-4 py-2 bg-white/10 rounded-lg">
                  <span className="text-gray-400 text-sm">Time Limit</span>
                  <p className="font-semibold">{quiz.timeLimit} min</p>
                </div>
              )}
            </div>

            {quiz.bestAttempt && (
              <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl mb-6">
                <p className="text-sm text-gray-400 mb-1">Your Best Score</p>
                <p className="text-2xl font-bold text-purple-400">
                  {quiz.bestAttempt.percentage}%
                </p>
                <p className="text-sm text-gray-400">
                  {quiz.bestAttempt.score} / {quiz.bestAttempt.maxScore} correct
                </p>
              </div>
            )}

            <button
              onClick={startQuiz}
              disabled={pageLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Taking quiz
  if (viewState === "taking") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto h-full">
          <QuizTaker
            attemptId={attemptId!}
            quizTitle={quiz.title}
            questions={quiz.questions}
            timeLimit={quiz.timeLimit}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    );
  }

  // Results
  if (viewState === "results" && results) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <QuizResults
          score={results.score}
          maxScore={results.maxScore}
          percentage={results.percentage}
          results={results.results}
          onRetry={handleRetry}
          onBack={() => router.push("/study")}
        />
      </div>
    );
  }

  return null;
}
