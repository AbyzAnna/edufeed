"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  AlertCircle,
  FileText,
  Brain,
  Video,
  Mic,
  BookOpen,
  HelpCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Output {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  audioUrl: string | null;
  status: string;
  createdAt: string;
}

interface OutputViewerModalProps {
  output: Output;
  onClose: () => void;
}

export default function OutputViewerModal({ output, onClose }: OutputViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isFullscreen]);

  const getIcon = () => {
    switch (output.type) {
      case "AUDIO_OVERVIEW": return <Mic className="w-5 h-5" />;
      case "VIDEO_OVERVIEW": return <Video className="w-5 h-5" />;
      case "MIND_MAP": return <Brain className="w-5 h-5" />;
      case "SUMMARY": return <FileText className="w-5 h-5" />;
      case "FLASHCARD_DECK": return <BookOpen className="w-5 h-5" />;
      case "QUIZ": return <HelpCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (output.type) {
      case "AUDIO_OVERVIEW": return "#8b5cf6";
      case "VIDEO_OVERVIEW": return "#ec4899";
      case "MIND_MAP": return "#f59e0b";
      case "SUMMARY": return "#3b82f6";
      case "FLASHCARD_DECK": return "#8b5cf6";
      case "QUIZ": return "#10b981";
      default: return "#6b7280";
    }
  };

  const renderViewer = () => {
    switch (output.type) {
      case "AUDIO_OVERVIEW":
        return <AudioOverviewViewer output={output} />;
      case "VIDEO_OVERVIEW":
        return <VideoOverviewViewer output={output} />;
      case "MIND_MAP":
        return <MindMapViewer output={output} />;
      case "SUMMARY":
        return <SummaryViewer output={output} />;
      case "FLASHCARD_DECK":
        return <FlashcardViewer output={output} />;
      case "QUIZ":
        return <QuizViewer output={output} />;
      default:
        return <GenericViewer output={output} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-[90vw] max-w-4xl h-[85vh]"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${getColor()}20` }}
            >
              <span style={{ color: getColor() }}>{getIcon()}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{output.title}</h2>
              <p className="text-sm text-white/50">
                {output.type.replace(/_/g, " ")} • {new Date(output.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-white/60" />
              ) : (
                <Maximize2 className="w-5 h-5 text-white/60" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderViewer()}
        </div>
      </div>
    </div>
  );
}

// ==================== Audio Overview Viewer ====================

function AudioOverviewViewer({ output }: { output: Output }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const content = output.content as {
    script?: Array<{ speaker: string; text: string }>;
    duration?: number;
    audioUrl?: string;
  };

  const audioUrl = output.audioUrl || content?.audioUrl;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <div className="flex justify-between text-sm text-white/60 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipBack className="w-6 h-6 text-white/80" />
            </button>
            <button
              onClick={togglePlay}
              className="p-4 bg-white rounded-full hover:bg-white/90 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-[#1a1a1a]" />
              ) : (
                <Play className="w-8 h-8 text-[#1a1a1a] ml-1" />
              )}
            </button>
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipForward className="w-6 h-6 text-white/80" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors ml-4"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white/60" />
              ) : (
                <Volume2 className="w-5 h-5 text-white/60" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {content?.script && content.script.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Transcript</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {content.script.map((segment, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-20 text-sm font-medium text-purple-400">
                  {segment.speaker}
                </div>
                <p className="text-white/80 leading-relaxed">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!audioUrl && (!content?.script || content.script.length === 0) && (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Audio content is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Video Overview Viewer ====================

function VideoOverviewViewer({ output }: { output: Output }) {
  const content = output.content as {
    segments?: Array<{
      title: string;
      narration: string;
      visualDescription: string;
      duration: string;
    }>;
    totalDuration?: string;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-6 h-6 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Video Script</h3>
          {content?.totalDuration && (
            <span className="text-sm text-white/50 ml-auto">
              Total: {content.totalDuration}
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm">
          This script can be used to create an educational video with visuals and narration.
        </p>
      </div>

      {content?.segments && content.segments.length > 0 ? (
        <div className="space-y-6">
          {content.segments.map((segment, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-5 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <h4 className="text-white font-medium">{segment.title}</h4>
                </div>
                {segment.duration && (
                  <span className="text-sm text-white/40">{segment.duration}</span>
                )}
              </div>

              <div className="space-y-3 pl-10">
                <div>
                  <p className="text-xs text-pink-400 uppercase tracking-wider mb-1">
                    Narration
                  </p>
                  <p className="text-white/80 leading-relaxed">{segment.narration}</p>
                </div>

                <div>
                  <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">
                    Visual
                  </p>
                  <p className="text-white/60 text-sm italic">
                    {segment.visualDescription}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Video script is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Mind Map Viewer ====================

function MindMapViewer({ output }: { output: Output }) {
  const content = output.content as {
    centralTopic?: string;
    branches?: Array<{
      topic: string;
      subtopics?: string[];
    }>;
  };

  const colors = [
    "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"
  ];

  return (
    <div className="p-6">
      {content?.centralTopic && content?.branches ? (
        <div className="min-h-[500px] relative">
          {/* Central Topic */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg shadow-amber-500/30 mb-8">
              {content.centralTopic}
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {content.branches.map((branch, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: `${colors[index % colors.length]}15`,
                    borderColor: `${colors[index % colors.length]}40`,
                  }}
                >
                  <h4
                    className="font-semibold text-lg mb-3"
                    style={{ color: colors[index % colors.length] }}
                  >
                    {branch.topic}
                  </h4>
                  {branch.subtopics && branch.subtopics.length > 0 && (
                    <ul className="space-y-2">
                      {branch.subtopics.map((subtopic, subIndex) => (
                        <li
                          key={subIndex}
                          className="flex items-start gap-2 text-white/70 text-sm"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          {subtopic}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Mind map is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Summary/Report Viewer ====================

function SummaryViewer({ output }: { output: Output }) {
  const content = output.content as {
    summary?: string;
    keyPoints?: string[];
    themes?: string[];
    executiveSummary?: string;
    keyFindings?: string[];
    recommendations?: string[];
    actionItems?: string[];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Main Summary */}
      {(content?.summary || content?.executiveSummary) && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
          <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {content?.executiveSummary ? "Executive Summary" : "Summary"}
          </h3>
          <p className="text-white/80 leading-relaxed">
            {content?.summary || content?.executiveSummary}
          </p>
        </div>
      )}

      {/* Key Points / Findings */}
      {(content?.keyPoints || content?.keyFindings) && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {content?.keyFindings ? "Key Findings" : "Key Points"}
          </h3>
          <ul className="space-y-3">
            {(content?.keyPoints || content?.keyFindings || []).map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-white/80">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Themes */}
      {content?.themes && content.themes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {content.themes.map((theme, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {content?.recommendations && content.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {content.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-white/70">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {content?.actionItems && content.actionItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Action Items</h3>
          <ul className="space-y-2">
            {content.actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-white/70">
                <div className="w-5 h-5 border-2 border-white/30 rounded flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!content?.summary && !content?.executiveSummary && !content?.keyPoints && !content?.keyFindings && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Report is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Flashcard Viewer ====================

function FlashcardViewer({ output }: { output: Output }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  const content = output.content as {
    cards?: Array<{
      front: string;
      back: string;
      hint?: string;
    }>;
  };

  const cards = content?.cards || [];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    setMasteredCards((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="p-6 text-center py-12">
        <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/50">Flashcards are being generated...</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isMastered = masteredCards.has(currentIndex);

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Progress */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{masteredCards.size} mastered</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="w-full max-w-xl h-[300px] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center backface-hidden ${
              isMastered ? "bg-green-500/20 border-green-500/40" : "bg-white/5 border-white/10"
            } border-2`}
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xl text-white leading-relaxed">{currentCard.front}</p>
            {currentCard.hint && (
              <p className="text-sm text-white/40 mt-4">Hint: {currentCard.hint}</p>
            )}
            <p className="text-sm text-white/30 mt-auto">Click to flip</p>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center text-center ${
              isMastered ? "bg-green-500/20 border-green-500/40" : "bg-purple-500/20 border-purple-500/40"
            } border-2`}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-xl text-white leading-relaxed">{currentCard.back}</p>
            <p className="text-sm text-white/30 mt-auto">Click to flip</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={handleMastered}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            isMastered
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isMastered ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Mastered
            </span>
          ) : (
            "Mark as Mastered"
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      <button
        onClick={handleReset}
        className="mt-4 text-sm text-white/50 hover:text-white flex items-center gap-1"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Progress
      </button>
    </div>
  );
}

// ==================== Quiz Viewer ====================

function QuizViewer({ output }: { output: Output }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const content = output.content as {
    questions?: Array<{
      type: string;
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
    }>;
  };

  const questions = content?.questions || [];

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 text-center py-12">
        <HelpCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/50">Quiz is being generated...</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== undefined;
  const isCorrect = selectedAnswers[currentQuestion] === currentQ.correctAnswer;

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation(false);
  };

  // Calculate score
  const score = questions.reduce((acc, q, index) => {
    return acc + (selectedAnswers[index] === q.correctAnswer ? 1 : 0);
  }, 0);

  if (showResults) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">
              {Math.round((score / questions.length) * 100)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h3>
          <p className="text-white/60 mb-6">
            You got {score} out of {questions.length} questions correct
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Object.keys(selectedAnswers).length} answered</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <p className="text-lg text-white leading-relaxed">{currentQ.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQ.options?.map((option, index) => {
          const isSelected = selectedAnswers[currentQuestion] === option;
          const isOptionCorrect = option === currentQ.correctAnswer;
          const showCorrectness = isAnswered;

          return (
            <button
              key={index}
              onClick={() => handleSelectAnswer(option)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                showCorrectness
                  ? isOptionCorrect
                    ? "bg-green-500/20 border-green-500 text-white"
                    : isSelected
                    ? "bg-red-500/20 border-red-500 text-white"
                    : "bg-white/5 border-white/10 text-white/60"
                  : isSelected
                  ? "bg-purple-500/20 border-purple-500 text-white"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {showCorrectness && isOptionCorrect && (
                  <Check className="w-5 h-5 text-green-400 ml-auto" />
                )}
                {showCorrectness && isSelected && !isOptionCorrect && (
                  <X className="w-5 h-5 text-red-400 ml-auto" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && currentQ.explanation && (
        <div className={`p-4 rounded-xl mb-6 ${isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-white/70 text-sm">{currentQ.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
        >
          {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
        </button>
      )}
    </div>
  );
}

// ==================== Generic Viewer ====================

function GenericViewer({ output }: { output: Output }) {
  return (
    <div className="p-6">
      <pre className="bg-white/5 rounded-xl p-4 overflow-auto text-sm text-white/70">
        {JSON.stringify(output.content, null, 2)}
      </pre>
    </div>
  );
}
