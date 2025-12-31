"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import {
  FileText,
  Link as LinkIcon,
  Type,
  Upload,
  Sparkles,
  ArrowRight,
  Youtube,
  Clock,
  Scissors,
  Wand2,
} from "lucide-react";

type SourceType = "PDF" | "URL" | "TEXT" | "YOUTUBE";
type GenerationType = "SLIDESHOW" | "AI_VIDEO" | "AVATAR" | "CLIP" | "WAN_VIDEO";

interface YouTubeClip {
  title: string;
  startTime: number;
  endTime: number;
  selected: boolean;
}

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [sourceType, setSourceType] = useState<SourceType>("TEXT");
  const [generationType, setGenerationType] = useState<GenerationType>("WAN_VIDEO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [youtubeClips, setYoutubeClips] = useState<YouTubeClip[]>([]);
  const [isAnalyzingYoutube, setIsAnalyzingYoutube] = useState(false);
  const [targetDuration, setTargetDuration] = useState(60);

  // Check if URL is YouTube
  const isYouTubeUrl = (urlString: string) => {
    return (
      urlString.includes("youtube.com") ||
      urlString.includes("youtu.be") ||
      urlString.includes("youtube.com/shorts")
    );
  };

  // Auto-detect YouTube URLs
  useEffect(() => {
    if (sourceType === "URL" && isYouTubeUrl(url)) {
      setSourceType("YOUTUBE");
    }
  }, [url, sourceType]);

  const analyzeYouTubeVideo = async () => {
    if (!url) return;
    setIsAnalyzingYoutube(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetDuration }),
      });

      if (!res.ok) throw new Error("Failed to analyze video");
      const data = await res.json();

      setYoutubeClips(
        data.clips.map((clip: Omit<YouTubeClip, "selected">) => ({
          ...clip,
          selected: true,
        }))
      );

      if (data.title && !title) {
        setTitle(data.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze video");
    } finally {
      setIsAnalyzingYoutube(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to Upload</h2>
          <p className="text-gray-400 mb-6">
            Create an account to start generating videos
          </p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageLoading(true);
    setError("");

    try {
      let fileUrl = "";

      if (sourceType === "PDF" && file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload file");
        }
        fileUrl = uploadData.url;
      }

      // Create source
      const sourceRes = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: sourceType,
          title,
          content: sourceType === "TEXT" ? content : undefined,
          originalUrl: sourceType === "URL" || sourceType === "YOUTUBE" ? url : undefined,
          fileUrl: sourceType === "PDF" ? fileUrl : undefined,
        }),
      });

      if (!sourceRes.ok) {
        const errorData = await sourceRes.json();
        throw new Error(errorData.error || "Failed to create source");
      }
      const source = await sourceRes.json();

      // For YouTube clips, create multiple videos
      if (sourceType === "YOUTUBE" && youtubeClips.length > 0) {
        const selectedClips = youtubeClips.filter((c) => c.selected);

        for (const clip of selectedClips) {
          await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: source.id,
              generationType: "CLIP",
              youtubeClip: clip,
            }),
          });
        }
      } else {
        await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: source.id,
            generationType,
            targetDuration,
          }),
        });
      }

      router.push("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPageLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create Learning Content</h1>
        <p className="text-gray-400 mb-8">
          Upload sources and we&apos;ll generate bite-sized educational videos
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Source Type</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { type: "TEXT" as SourceType, icon: Type, label: "Topic" },
                { type: "URL" as SourceType, icon: LinkIcon, label: "Article" },
                { type: "YOUTUBE" as SourceType, icon: Youtube, label: "YouTube" },
                { type: "PDF" as SourceType, icon: FileText, label: "PDF" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  className={`p-4 rounded-xl border transition-all ${
                    sourceType === type
                      ? type === "YOUTUBE"
                        ? "border-red-500 bg-red-500/20"
                        : "border-purple-500 bg-purple-500/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      sourceType === type && type === "YOUTUBE"
                        ? "text-red-500"
                        : ""
                    }`}
                  />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a title"
              className="w-full"
              required
            />
          </div>

          {/* Content based on source type */}
          {sourceType === "TEXT" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Topic or Course Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the topic, course name, or paste your study notes..."
                className="w-full h-40 resize-none"
                required
              />
            </div>
          )}

          {sourceType === "URL" && (
            <div>
              <label className="block text-sm font-medium mb-2">Article URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full"
                required
              />
            </div>
          )}

          {sourceType === "YOUTUBE" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  YouTube Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1"
                    required
                  />
                  <button
                    type="button"
                    onClick={analyzeYouTubeVideo}
                    disabled={!url || isAnalyzingYoutube}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isAnalyzingYoutube ? (
                      <div className="spinner w-4 h-4" />
                    ) : (
                      <Scissors className="w-4 h-4" />
                    )}
                    <span>Find Clips</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We&apos;ll analyze the video and suggest the most educational
                  segments
                </p>
              </div>

              {/* Duration selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Target Clip Duration
                </label>
                <div className="flex gap-2">
                  {[30, 60, 90].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setTargetDuration(duration)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        targetDuration === duration
                          ? "bg-red-500/20 border-red-500 border"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {duration}s
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube Clips */}
              {youtubeClips.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Suggested Clips ({youtubeClips.filter((c) => c.selected).length}{" "}
                    selected)
                  </label>
                  <div className="space-y-2">
                    {youtubeClips.map((clip, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setYoutubeClips((prev) =>
                            prev.map((c, i) =>
                              i === index ? { ...c, selected: !c.selected } : c
                            )
                          );
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          clip.selected
                            ? "border-red-500 bg-red-500/10"
                            : "border-white/10 bg-white/5 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{clip.title}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                              <span className="ml-2 text-xs">
                                ({clip.endTime - clip.startTime}s)
                              </span>
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              clip.selected
                                ? "bg-red-500 border-red-500"
                                : "border-white/30"
                            }`}
                          >
                            {clip.selected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {sourceType === "PDF" && (
            <div>
              <label className="block text-sm font-medium mb-2">PDF File</label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                  required={sourceType === "PDF"}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  {file ? (
                    <p className="text-white font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-white font-medium mb-1">
                        Drop your PDF here
                      </p>
                      <p className="text-gray-400 text-sm">or click to browse</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Generation Type (hide for YouTube) */}
          {sourceType !== "YOUTUBE" && (
            <div>
              <label className="block text-sm font-medium mb-3">Video Style</label>
              <div className="space-y-3">
                {[
                  {
                    type: "WAN_VIDEO" as GenerationType,
                    label: "WAN 2.1 AI Video",
                    description: "Alibaba's cutting-edge AI video generation",
                    badge: "NEW",
                    highlight: true,
                  },
                  {
                    type: "SLIDESHOW" as GenerationType,
                    label: "Slideshow",
                    description: "Animated text cards with narration",
                    badge: "Fast",
                  },
                  {
                    type: "AVATAR" as GenerationType,
                    label: "AI Presenter",
                    description: "AI avatar explains the content",
                    badge: "Engaging",
                  },
                  {
                    type: "AI_VIDEO" as GenerationType,
                    label: "Cinematic",
                    description: "AI-generated visuals and scenes",
                    badge: "Premium",
                  },
                ].map(({ type, label, description, badge, highlight }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGenerationType(type)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      generationType === type
                        ? highlight
                          ? "border-green-500 bg-green-500/20"
                          : "border-purple-500 bg-purple-500/20"
                        : highlight
                        ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {highlight && <Wand2 className="w-5 h-5 text-green-400" />}
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-gray-400">{description}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      highlight
                        ? "bg-green-500 text-white font-semibold"
                        : "bg-white/10"
                    }`}>
                      {badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration selector for non-YouTube */}
          {sourceType !== "YOUTUBE" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Video Duration
              </label>
              <div className="flex gap-2">
                {[30, 60, 90].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setTargetDuration(duration)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      targetDuration === duration
                        ? "bg-purple-500/20 border-purple-500 border"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {duration}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={pageLoading}
            className={`w-full font-medium px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
              sourceType === "YOUTUBE"
                ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                : "bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            } disabled:cursor-not-allowed text-white`}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {sourceType === "YOUTUBE"
                    ? `Create ${
                        youtubeClips.filter((c) => c.selected).length || ""
                      } Clip${
                        youtubeClips.filter((c) => c.selected).length !== 1
                          ? "s"
                          : ""
                      }`
                    : "Generate Video"}
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
