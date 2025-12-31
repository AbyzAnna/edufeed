"use client";

import { useState } from "react";
import {
  X,
  Link as LinkIcon,
  FileText,
  Youtube,
  Type,
  Upload,
  AlertCircle,
  Image,
  Mic,
  FileSpreadsheet,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  onSourceAdded: (source: unknown) => void;
}

type SourceType = "URL" | "PDF" | "YOUTUBE" | "TEXT" | "IMAGE" | "AUDIO" | "GOOGLE_DOC";

const SOURCE_TYPES = [
  { type: "URL" as SourceType, icon: LinkIcon, label: "Website URL", description: "Import content from any webpage" },
  { type: "PDF" as SourceType, icon: FileText, label: "PDF Document", description: "Upload a PDF file" },
  { type: "YOUTUBE" as SourceType, icon: Youtube, label: "YouTube Video", description: "Import video transcript" },
  { type: "TEXT" as SourceType, icon: Type, label: "Plain Text", description: "Paste or type text directly" },
  { type: "IMAGE" as SourceType, icon: Image, label: "Image", description: "Upload an image for OCR extraction" },
  { type: "AUDIO" as SourceType, icon: Mic, label: "Audio File", description: "Upload audio for transcription" },
  { type: "GOOGLE_DOC" as SourceType, icon: FileSpreadsheet, label: "Google Doc", description: "Import from Google Docs URL" },
];

export default function AddSourceModal({
  isOpen,
  onClose,
  notebookId,
  onSourceAdded,
}: AddSourceModalProps) {
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setLoading(true);
    setError("");

    try {
      let fileUrl = null;

      // If file upload type (PDF, IMAGE, AUDIO), upload file first
      if ((selectedType === "PDF" || selectedType === "IMAGE" || selectedType === "AUDIO") && file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.url;
      }

      // Determine which sources need URL
      const urlTypes = ["URL", "YOUTUBE", "GOOGLE_DOC"];
      const fileTypes = ["PDF", "IMAGE", "AUDIO"];

      // Add source to notebook
      const response = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          title: title.trim() || getDefaultTitle(),
          url: urlTypes.includes(selectedType) ? url : null,
          fileUrl: fileTypes.includes(selectedType) ? fileUrl : null,
          content: selectedType === "TEXT" ? content : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add source");
      }

      const source = await response.json();
      onSourceAdded(source);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTitle = () => {
    switch (selectedType) {
      case "URL":
        try {
          return new URL(url).hostname;
        } catch {
          return "Web Source";
        }
      case "PDF":
        return file?.name || "PDF Document";
      case "YOUTUBE":
        return "YouTube Video";
      case "TEXT":
        return content.slice(0, 50) || "Text Note";
      case "IMAGE":
        return file?.name || "Image";
      case "AUDIO":
        return file?.name || "Audio File";
      case "GOOGLE_DOC":
        try {
          return new URL(url).pathname.split("/").pop() || "Google Doc";
        } catch {
          return "Google Doc";
        }
      default:
        return "New Source";
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setTitle("");
    setUrl("");
    setContent("");
    setFile(null);
    setError("");
    onClose();
  };

  const validateUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const isYouTubeUrl = (urlString: string) => {
    return urlString.includes("youtube.com") || urlString.includes("youtu.be");
  };

  const isGoogleDocUrl = (urlString: string) => {
    return urlString.includes("docs.google.com");
  };

  const getFileAccept = () => {
    switch (selectedType) {
      case "PDF":
        return ".pdf";
      case "IMAGE":
        return "image/*";
      case "AUDIO":
        return "audio/*,.mp3,.wav,.m4a,.ogg,.flac";
      default:
        return "*";
    }
  };

  const getFileLabel = () => {
    switch (selectedType) {
      case "PDF":
        return { title: "Upload PDF", desc: "PDF up to 200MB" };
      case "IMAGE":
        return { title: "Upload Image", desc: "JPG, PNG, GIF up to 20MB" };
      case "AUDIO":
        return { title: "Upload Audio", desc: "MP3, WAV, M4A up to 100MB" };
      default:
        return { title: "Upload File", desc: "Select a file" };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {selectedType ? `Add ${SOURCE_TYPES.find(s => s.type === selectedType)?.label}` : "Add Source"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!selectedType ? (
            /* Source Type Selection */
            <div className="grid grid-cols-2 gap-3">
              {SOURCE_TYPES.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-left group"
                >
                  <Icon className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-medium text-white">{label}</div>
                  <div className="text-sm text-white/50">{description}</div>
                </button>
              ))}
            </div>
          ) : (
            /* Source Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Change source type
              </button>

              {/* URL Input - for URL, YOUTUBE, and GOOGLE_DOC */}
              {(selectedType === "URL" || selectedType === "YOUTUBE" || selectedType === "GOOGLE_DOC") && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {selectedType === "YOUTUBE" ? "YouTube URL" :
                     selectedType === "GOOGLE_DOC" ? "Google Docs URL" : "Website URL"}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                      selectedType === "YOUTUBE"
                        ? "https://youtube.com/watch?v=..."
                        : selectedType === "GOOGLE_DOC"
                        ? "https://docs.google.com/document/d/..."
                        : "https://example.com/article"
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    autoFocus
                  />
                  {url && !validateUrl(url) && (
                    <p className="mt-1 text-sm text-red-400">Please enter a valid URL</p>
                  )}
                  {selectedType === "YOUTUBE" && url && !isYouTubeUrl(url) && (
                    <p className="mt-1 text-sm text-yellow-400">This doesn&apos;t look like a YouTube URL</p>
                  )}
                  {selectedType === "GOOGLE_DOC" && url && !isGoogleDocUrl(url) && (
                    <p className="mt-1 text-sm text-yellow-400">This doesn&apos;t look like a Google Docs URL</p>
                  )}
                  {selectedType === "GOOGLE_DOC" && (
                    <p className="mt-1 text-sm text-white/40">
                      Note: The document must be publicly accessible or shared with view access
                    </p>
                  )}
                </div>
              )}

              {/* File Upload - for PDF, IMAGE, and AUDIO */}
              {(selectedType === "PDF" || selectedType === "IMAGE" || selectedType === "AUDIO") && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {getFileLabel().title}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept={getFileAccept()}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-3 p-8 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                    >
                      {file ? (
                        <div className="text-center">
                          {selectedType === "PDF" && <FileText className="w-10 h-10 text-purple-400 mx-auto mb-2" />}
                          {selectedType === "IMAGE" && <Image className="w-10 h-10 text-purple-400 mx-auto mb-2" />}
                          {selectedType === "AUDIO" && <Mic className="w-10 h-10 text-purple-400 mx-auto mb-2" />}
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-white/50 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-10 h-10 text-white/40 mx-auto mb-2" />
                          <p className="text-white/60">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-white/40 text-sm">{getFileLabel().desc}</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Text Input */}
              {selectedType === "TEXT" && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste or type your notes here..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    autoFocus
                  />
                  <p className="mt-1 text-sm text-white/40">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              )}

              {/* Custom Title */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Title{" "}
                  <span className="text-white/40 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={getDefaultTitle()}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={
                    (selectedType === "URL" && !validateUrl(url)) ||
                    (selectedType === "YOUTUBE" && !validateUrl(url)) ||
                    (selectedType === "GOOGLE_DOC" && !validateUrl(url)) ||
                    (selectedType === "PDF" && !file) ||
                    (selectedType === "IMAGE" && !file) ||
                    (selectedType === "AUDIO" && !file) ||
                    (selectedType === "TEXT" && !content.trim())
                  }
                  className="flex-1"
                >
                  Add Source
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
