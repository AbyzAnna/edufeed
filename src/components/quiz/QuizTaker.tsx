"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

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

interface QuizTakerProps {
  attemptId: string;
  quizTitle: string;
  questions: QuizQuestion[];
  timeLimit?: number | null;
  onSubmit: (
    answers: { questionId: string; answer: string; timeSpent?: number }[],
    totalTimeSpent: number
  ) => void;
}

export default function QuizTaker({
  attemptId,
  quizTitle,
  questions,
  timeLimit,
  onSubmit,
}: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Map<string, number>>(
    new Map()
  );
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.size;

  // Timer countdown
  useEffect(() => {
    if (!timeLimit) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestion.id, optionId);
        return newAnswers;
      });

      // Track time spent on this question
      const timeSpent = Date.now() - questionStartTime;
      setQuestionTimes((prev) => {
        const newTimes = new Map(prev);
        newTimes.set(
          currentQuestion.id,
          (prev.get(currentQuestion.id) || 0) + timeSpent
        );
        return newTimes;
      });
    },
    [currentQuestion, questionStartTime]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex]);

  const handleGoToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
    setQuestionStartTime(Date.now());
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const totalTimeSpent = Math.round((Date.now() - startTime) / 1000);

    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      answer: answers.get(q.id) || "",
      timeSpent: questionTimes.get(q.id),
    }));

    onSubmit(formattedAnswers, totalTimeSpent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold truncate">{quizTitle}</h2>
        {timeLimit && timeRemaining !== null && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timeRemaining < 60
                ? "bg-red-500/20 text-red-400"
                : timeRemaining < 300
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-white/10"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <div className="card p-6 mb-6">
          <p className="text-lg font-medium mb-6">{currentQuestion.text}</p>

          <div className="space-y-3">
            {(currentQuestion.options as QuizOption[]).map((option) => {
              const isSelected = answers.get(currentQuestion.id) === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium ${
                        isSelected
                          ? "bg-purple-500 text-white"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      {option.id}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {questions.map((q, index) => {
            const isAnswered = answers.has(q.id);
            const isCurrent = index === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => handleGoToQuestion(index)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-purple-600 text-white"
                    : isAnswered
                    ? "bg-green-600/30 text-green-400"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Quiz
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Unanswered warning */}
      {answeredCount < questions.length && currentIndex === questions.length - 1 && (
        <div className="mt-4 flex items-center gap-2 text-yellow-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>
            You have {questions.length - answeredCount} unanswered question
            {questions.length - answeredCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
