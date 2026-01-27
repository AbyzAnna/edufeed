"use client";

import { useState } from "react";
import { X, Flag, AlertTriangle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

type ReportContentType =
  | "STUDY_ROOM"
  | "NOTEBOOK"
  | "COMMENT"
  | "USER"
  | "FEED_ITEM"
  | "MESSAGE";

type ReportReason =
  | "INAPPROPRIATE_CONTENT"
  | "HARASSMENT"
  | "SPAM"
  | "MISINFORMATION"
  | "HATE_SPEECH"
  | "VIOLENCE"
  | "SEXUAL_CONTENT"
  | "COPYRIGHT"
  | "OTHER";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "Inappropriate Content",
    description: "Content that is offensive or not suitable for the platform",
  },
  {
    value: "HARASSMENT",
    label: "Harassment or Bullying",
    description: "Content targeting or intimidating specific individuals",
  },
  {
    value: "HATE_SPEECH",
    label: "Hate Speech",
    description: "Discriminatory content based on race, religion, gender, etc.",
  },
  {
    value: "SPAM",
    label: "Spam",
    description: "Repetitive, promotional, or irrelevant content",
  },
  {
    value: "MISINFORMATION",
    label: "Misinformation",
    description: "Deliberately false or misleading information",
  },
  {
    value: "VIOLENCE",
    label: "Violence or Threats",
    description: "Content promoting violence or containing threats",
  },
  {
    value: "SEXUAL_CONTENT",
    label: "Sexual Content",
    description: "Sexually explicit or suggestive material",
  },
  {
    value: "COPYRIGHT",
    label: "Copyright Violation",
    description: "Content that infringes on intellectual property rights",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other violation not listed above",
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason for your report");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit report");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    setError(null);
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  const contentTypeLabel = {
    STUDY_ROOM: "Study Room",
    NOTEBOOK: "Notebook",
    COMMENT: "Comment",
    USER: "User",
    FEED_ITEM: "Feed Item",
    MESSAGE: "Message",
  }[contentType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Report {contentTypeLabel}
              </h2>
              {contentTitle && (
                <p className="text-sm text-white/60 truncate max-w-[250px]">
                  {contentTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Report Submitted
              </h3>
              <p className="text-white/60 mb-6">
                Thank you for helping keep our community safe. We&apos;ll review your
                report and take appropriate action.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          ) : (
            <>
              <p className="text-white/60 mb-4">
                Help us understand what&apos;s wrong with this content. Your report
                will be reviewed by our moderation team.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Reason Selection */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-white">
                  Why are you reporting this?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedReason === reason.value
                          ? "bg-purple-500/20 border-purple-500"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-white text-sm">
                        {reason.label}
                      </div>
                      <div className="text-white/50 text-xs mt-0.5">
                        {reason.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context that might help us understand the issue..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-right text-xs text-white/40">
                  {description.length}/500
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="flex gap-3 p-4 border-t border-white/10">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
