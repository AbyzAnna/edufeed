"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Loader2,
  Film,
} from "lucide-react";
import AdvancedMindMapViewer from "./MindMapViewer";

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
        return <AdvancedMindMapViewer content={output.content} />;
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

  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const nestedContent = rawContent?.content as {
    script?: Array<{ speaker: string; text: string }>;
    duration?: number;
    audioUrl?: string;
  } | undefined;

  // Try multiple paths to find audio data
  const script = (rawContent?.script as Array<{ speaker: string; text: string }>) || nestedContent?.script || [];
  const audioUrl = output.audioUrl || (rawContent?.audioUrl as string) || nestedContent?.audioUrl;

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
            muted={isMuted}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => {
              console.error('Audio failed to load:', e);
            }}
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
      {script.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Transcript</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {script.map((segment, index) => (
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

      {!audioUrl && script.length === 0 && (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Audio content is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Video Overview Viewer ====================

interface VideoSegment {
  title: string;
  narration: string;
  visualDescription?: string;
  duration: number;
  imageUrl?: string;
}

interface VideoGenerationProgress {
  stage: "loading" | "preparing" | "processing" | "encoding" | "finalizing" | "complete" | "error";
  progress: number;
  message: string;
}

function VideoOverviewViewer({ output }: { output: Output }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // Real video generation state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoGenerationProgress | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [ffmpegSupported, setFfmpegSupported] = useState<boolean | null>(null);

  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const nestedContent = rawContent?.content as {
    segments?: VideoSegment[];
    totalDuration?: number;
    videoUrl?: string;
    audioUrl?: string;
    thumbnailUrl?: string;
    isActualVideo?: boolean;
  } | undefined;

  // Check if this is actual video content (with AI-generated images)
  const isActualVideo = (rawContent?.isActualVideo as boolean) || nestedContent?.isActualVideo;

  // Extract video data
  const segments = (rawContent?.segments as VideoSegment[]) || nestedContent?.segments || [];
  const totalDuration = (rawContent?.totalDuration as number) || nestedContent?.totalDuration || 0;
  const audioUrl = (rawContent?.audioUrl as string) || nestedContent?.audioUrl;
  const thumbnailUrl = (rawContent?.thumbnailUrl as string) || nestedContent?.thumbnailUrl;

  // Check FFmpeg support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const { isFFmpegSupported } = await import("@/lib/video/ffmpeg-video-generator");
        setFfmpegSupported(isFFmpegSupported());
      } catch {
        setFfmpegSupported(false);
      }
    };
    checkSupport();
  }, []);

  // Calculate segment timings
  const segmentTimings = useMemo(() => {
    let elapsed = 0;
    return segments.map((segment) => {
      const start = elapsed;
      const duration = segment.duration || 5;
      elapsed += duration;
      return { start, end: elapsed, duration };
    });
  }, [segments]);

  // Video style state
  const [videoStyle, setVideoStyle] = useState<"enhanced" | "simple">("enhanced");

  // Generate real video from images
  const generateRealVideo = useCallback(async () => {
    if (isGeneratingVideo || segments.length === 0) return;

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoProgress({ stage: "loading", progress: 0, message: "Starting video encoder..." });

    try {
      const { generateVideo, generateVideoSimple, initFFmpeg } = await import("@/lib/video/ffmpeg-video-generator");

      // Initialize FFmpeg first
      const initialized = await initFFmpeg((progress) => setVideoProgress(progress));
      if (!initialized) {
        throw new Error("Failed to initialize video encoder. Please try again.");
      }

      // Choose generation method based on style
      const generateFn = videoStyle === "enhanced" ? generateVideo : generateVideoSimple;

      // Generate video with style options
      const result = await generateFn(
        {
          segments,
          audioUrl,
          totalDuration,
          style: videoStyle === "enhanced" ? {
            kenBurns: true,
            transitions: "crossfade",
            transitionDuration: 0.5,
            showTitles: true,
            showProgressBar: true,
            resolution: "720p",
          } : undefined,
        },
        (progress) => setVideoProgress(progress)
      );

      setGeneratedVideoUrl(result.videoUrl);
      setVideoProgress({ stage: "complete", progress: 100, message: "Video ready!" });
    } catch (error) {
      console.error("Video generation failed:", error);
      setVideoError(error instanceof Error ? error.message : "Video generation failed");
      setVideoProgress({ stage: "error", progress: 0, message: "Failed to generate video" });
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [segments, audioUrl, totalDuration, isGeneratingVideo, videoStyle]);

  // Download the generated video
  const downloadVideo = useCallback(() => {
    if (!generatedVideoUrl) return;

    const link = document.createElement("a");
    link.href = generatedVideoUrl;
    link.download = `${output.title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedVideoUrl, output.title]);

  // Cleanup video URL on unmount
  useEffect(() => {
    return () => {
      if (generatedVideoUrl) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, [generatedVideoUrl]);

  // Video player handlers
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Find current segment based on time
      for (let i = 0; i < segmentTimings.length; i++) {
        const timing = segmentTimings[i];
        if (videoRef.current.currentTime >= timing.start && videoRef.current.currentTime < timing.end) {
          if (currentSegment !== i) setCurrentSegment(i);
          break;
        }
      }
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Skip forward/backward
  const skipVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // If we have a generated real video, show the video player
  if (generatedVideoUrl) {
    return (
      <div className="flex flex-col h-full">
        {/* Video Player */}
        <div className="relative bg-black aspect-video w-full">
          <video
            ref={videoRef}
            src={generatedVideoUrl}
            className="w-full h-full"
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
              setCurrentSegment(0);
            }}
            onClick={toggleVideoPlay}
          />

          {/* Video Controls Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={toggleVideoPlay}
                className="p-4 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <div className="relative mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleVideoSeek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => skipVideo(-10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={toggleVideoPlay}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => skipVideo(10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <span className="text-sm text-white ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <button
                  onClick={downloadVideo}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download MP4
                </button>
              </div>
            </div>
          </div>

          {/* Current Segment Indicator */}
          {segments[currentSegment] && (
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-sm font-medium">{segments[currentSegment].title}</p>
            </div>
          )}
        </div>

        {/* Segment Timeline */}
        <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {segments.map((segment, index) => (
              <button
                key={index}
                onClick={() => handleVideoSeek(segmentTimings[index]?.start || 0)}
                className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentSegment
                    ? "border-pink-500 scale-105"
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                {segment.imageUrl ? (
                  <img
                    src={segment.imageUrl}
                    alt={segment.title}
                    className="w-full h-14 object-cover"
                  />
                ) : (
                  <div className="w-full h-14 bg-gradient-to-br from-pink-600/40 to-purple-600/40" />
                )}
                <div className="p-1 bg-black/60">
                  <p className="text-[10px] text-white truncate">{segment.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-auto p-4">
          <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Transcript
          </h4>
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={index}
                onClick={() => handleVideoSeek(segmentTimings[index]?.start || 0)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentSegment
                    ? "bg-pink-500/20 border border-pink-500/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-pink-400 font-medium">
                    {formatTime(segmentTimings[index]?.start || 0)}
                  </span>
                  <span className="text-sm text-white font-medium">{segment.title}</span>
                </div>
                <p className="text-sm text-white/70">{segment.narration}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If video generation is in progress, show progress
  if (isGeneratingVideo || videoProgress?.stage === "loading" || videoProgress?.stage === "preparing" || videoProgress?.stage === "processing" || videoProgress?.stage === "encoding") {
    // CRITICAL: Validate and clamp progress value to prevent display issues
    // This handles cases where FFmpeg might report invalid progress values
    const rawProgress = videoProgress?.progress ?? 0;
    const safeProgress = Number.isFinite(rawProgress) ? Math.max(0, Math.min(100, Math.round(rawProgress))) : 0;
    const progressRatio = safeProgress / 100;

    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-full max-w-md">
          {/* Progress Circle */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - progressRatio)}
                className="text-pink-500 transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{safeProgress}%</span>
            </div>
          </div>

          {/* Stage Indicator */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
              <span className="text-lg font-medium text-white">
                {videoProgress?.message || "Generating video..."}
              </span>
            </div>
            <p className="text-sm text-white/60">
              This may take a moment depending on video length
            </p>
          </div>

          {/* Stage Steps */}
          <div className="space-y-2">
            {[
              { stage: "loading", label: "Loading encoder" },
              { stage: "preparing", label: "Preparing images" },
              { stage: "processing", label: "Applying effects" },
              { stage: "encoding", label: "Encoding video" },
              { stage: "finalizing", label: "Finalizing" },
            ].map(({ stage, label }) => {
              const currentStage = videoProgress?.stage;
              const stages = ["loading", "preparing", "processing", "encoding", "finalizing", "complete"];
              const currentIndex = stages.indexOf(currentStage || "");
              const stageIndex = stages.indexOf(stage);
              const isComplete = currentIndex > stageIndex;
              const isCurrent = currentStage === stage;

              return (
                <div key={stage} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-pink-500"
                        : "bg-white/10"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-white/30 rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isComplete || isCurrent ? "text-white" : "text-white/40"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // If we have segments with images and FFmpeg is supported, show option to generate real video
  if (isActualVideo && segments.length > 0 && segments.some((s) => s.imageUrl)) {
    const currentSegmentData = segments[currentSegment];

    return (
      <div className="flex flex-col h-full">
        {/* Generate Video Banner */}
        {ffmpegSupported && !videoError && (
          <div className="flex-shrink-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-pink-500/30 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Film className="w-6 h-6 text-pink-400" />
                <div>
                  <p className="text-white font-medium">Generate Real Video</p>
                  <p className="text-sm text-white/60">
                    Compile images + audio into a downloadable MP4 file
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Video Style Toggle */}
                <div className="flex bg-black/30 rounded-lg p-1">
                  <button
                    onClick={() => setVideoStyle("enhanced")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      videoStyle === "enhanced"
                        ? "bg-pink-500 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setVideoStyle("simple")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      videoStyle === "simple"
                        ? "bg-pink-500 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Fast
                  </button>
                </div>
                <button
                  onClick={generateRealVideo}
                  disabled={isGeneratingVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-500/50 rounded-lg text-white font-medium transition-colors"
                >
                  <Video className="w-5 h-5" />
                  Generate MP4
                </button>
              </div>
            </div>
            {videoStyle === "enhanced" && (
              <p className="text-xs text-white/40 mt-2">
                ✨ Ken Burns zoom/pan • Crossfade transitions • Title overlays • Progress bar
              </p>
            )}
            {videoStyle === "simple" && (
              <p className="text-xs text-white/40 mt-2">
                ⚡ Faster generation • Basic slideshow • No effects
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {videoError && (
          <div className="flex-shrink-0 bg-red-500/20 border-b border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{videoError}</p>
              <button
                onClick={() => {
                  setVideoError(null);
                  generateRealVideo();
                }}
                className="ml-auto px-3 py-1 bg-red-500/30 hover:bg-red-500/40 rounded text-red-200 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* FFmpeg not supported message */}
        {ffmpegSupported === false && (
          <div className="flex-shrink-0 bg-yellow-500/20 border-b border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-300">Real video generation requires special browser support.</p>
                <p className="text-sm text-yellow-300/60">
                  Your server needs CORS headers: Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden audio element for slideshow narration */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="auto"
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentSegment(0);
              setCurrentTime(0);
            }}
          />
        )}

        {/* Slideshow Display Area (fallback) */}
        <div
          className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => {
            if (audioRef.current) {
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
            }
            setIsPlaying(!isPlaying);
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => !isPlaying && setShowControls(true)}
        >
          {/* Current Segment Image */}
          {currentSegmentData?.imageUrl ? (
            <img
              src={currentSegmentData.imageUrl}
              alt={currentSegmentData.title}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-600/40 to-purple-600/40 flex items-center justify-center">
              <Video className="w-20 h-20 text-white/30" />
            </div>
          )}

          {/* Segment Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h3 className="text-white text-xl font-semibold mb-2">
              {currentSegmentData?.title}
            </h3>
            <p className="text-white/80 text-sm line-clamp-2">
              {currentSegmentData?.narration}
            </p>
          </div>

          {/* Play/Pause Overlay */}
          {showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
              <button className="p-4 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors">
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-pink-500 transition-all duration-300"
              style={{
                width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Timeline with Segments */}
        <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-white/60 mb-3">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>

          {/* Segment Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {segments.map((segment, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSegment(index);
                  const timing = segmentTimings[index];
                  if (timing && audioRef.current) {
                    audioRef.current.currentTime = timing.start;
                    setCurrentTime(timing.start);
                  }
                }}
                className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentSegment
                    ? "border-pink-500 scale-105"
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                {segment.imageUrl ? (
                  <img
                    src={segment.imageUrl}
                    alt={segment.title}
                    className="w-full h-14 object-cover"
                  />
                ) : (
                  <div className="w-full h-14 bg-gradient-to-br from-pink-600/40 to-purple-600/40" />
                )}
                <div className="p-1 bg-black/60">
                  <p className="text-[10px] text-white truncate">{segment.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Full Transcript */}
        <div className="flex-1 overflow-auto p-4">
          <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Transcript
          </h4>
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={index}
                onClick={() => {
                  setCurrentSegment(index);
                  const timing = segmentTimings[index];
                  if (timing && audioRef.current) {
                    audioRef.current.currentTime = timing.start;
                    setCurrentTime(timing.start);
                  }
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentSegment
                    ? "bg-pink-500/20 border border-pink-500/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-pink-400 font-medium">
                    {formatTime(segmentTimings[index]?.start || 0)}
                  </span>
                  <span className="text-sm text-white font-medium">{segment.title}</span>
                </div>
                <p className="text-sm text-white/70">{segment.narration}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Show script-only view for old-style content
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-6 h-6 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Video Script</h3>
          {totalDuration > 0 && (
            <span className="text-sm text-white/50 ml-auto">
              Total: {formatTime(totalDuration)}
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm">
          This script can be used to create an educational video with visuals and narration.
        </p>
      </div>

      {segments.length > 0 ? (
        <div className="space-y-6">
          {segments.map((segment, index) => (
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
                  <span className="text-sm text-white/40">{segment.duration}s</span>
                )}
              </div>

              <div className="space-y-3 pl-10">
                <div>
                  <p className="text-xs text-pink-400 uppercase tracking-wider mb-1">
                    Narration
                  </p>
                  <p className="text-white/80 leading-relaxed">{segment.narration}</p>
                </div>

                {segment.visualDescription && (
                  <div>
                    <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">
                      Visual
                    </p>
                    <p className="text-white/60 text-sm italic">
                      {segment.visualDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">Video is being generated...</p>
        </div>
      )}
    </div>
  );
}

// ==================== Mind Map Viewer ====================

function MindMapViewer({ output }: { output: Output }) {
  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const nestedContent = rawContent?.content as { centralTopic?: string; branches?: Array<{ topic: string; subtopics?: string[] }> } | undefined;

  // Try multiple paths to find mind map data
  const centralTopic = (rawContent?.centralTopic as string) || nestedContent?.centralTopic;
  const branches = (rawContent?.branches as Array<{ topic: string; subtopics?: string[] }>) || nestedContent?.branches || [];

  const colors = [
    "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"
  ];

  return (
    <div className="p-6">
      {centralTopic && branches.length > 0 ? (
        <div className="min-h-[500px] relative">
          {/* Central Topic */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg shadow-amber-500/30 mb-8">
              {centralTopic}
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {branches.map((branch, index) => (
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
  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const nestedContent = rawContent?.content as {
    summary?: string;
    keyPoints?: string[];
    themes?: string[];
    executiveSummary?: string;
    keyFindings?: string[];
    recommendations?: string[];
    actionItems?: string[];
  } | undefined;

  // Try multiple paths to find summary data
  const summary = (rawContent?.summary as string) || nestedContent?.summary;
  const executiveSummary = (rawContent?.executiveSummary as string) || nestedContent?.executiveSummary;
  const keyPoints = (rawContent?.keyPoints as string[]) || nestedContent?.keyPoints;
  const keyFindings = (rawContent?.keyFindings as string[]) || nestedContent?.keyFindings;
  const themes = (rawContent?.themes as string[]) || nestedContent?.themes;
  const recommendations = (rawContent?.recommendations as string[]) || nestedContent?.recommendations;
  const actionItems = (rawContent?.actionItems as string[]) || nestedContent?.actionItems;

  return (
    <div className="p-6 space-y-6">
      {/* Main Summary */}
      {(summary || executiveSummary) && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
          <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {executiveSummary ? "Executive Summary" : "Summary"}
          </h3>
          <p className="text-white/80 leading-relaxed">
            {summary || executiveSummary}
          </p>
        </div>
      )}

      {/* Key Points / Findings */}
      {(keyPoints || keyFindings) && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {keyFindings ? "Key Findings" : "Key Points"}
          </h3>
          <ul className="space-y-3">
            {(keyPoints || keyFindings || []).map((point, index) => (
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
      {themes && themes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, index) => (
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
      {recommendations && recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-white/70">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {actionItems && actionItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Action Items</h3>
          <ul className="space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-white/70">
                <div className="w-5 h-5 border-2 border-white/30 rounded flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!summary && !executiveSummary && !keyPoints && !keyFindings && (
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

  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const content = rawContent?.content as { cards?: Array<{ front: string; back: string; hint?: string }> } | undefined;

  // Try multiple paths to find cards array
  const cards = (
    (rawContent?.cards as Array<{ front: string; back: string; hint?: string }>) ||
    content?.cards ||
    []
  );

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

  // Handle various content structures from API
  const rawContent = output.content as Record<string, unknown>;
  const nestedContent = rawContent?.content as { questions?: Array<{ type: string; question: string; options?: string[]; correctAnswer: string; explanation?: string }> } | undefined;

  // Try multiple paths to find questions array
  const questions = (
    (rawContent?.questions as Array<{ type: string; question: string; options?: string[]; correctAnswer: string; explanation?: string }>) ||
    nestedContent?.questions ||
    []
  );

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
