"use client";

import { ReactNode } from "react";
import { Brain, Sparkles, Loader2, X, Minimize2, Maximize2 } from "lucide-react";

interface TitledWindowProps {
  title: string;
  children: ReactNode;
  isThinking?: boolean;
  thinkingText?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  variant?: "default" | "elevated" | "glass";
}

export default function TitledWindow({
  title,
  children,
  isThinking = false,
  thinkingText = "Thinking...",
  icon,
  headerActions,
  onClose,
  onMinimize,
  onMaximize,
  size = "md",
  className = "",
  variant = "default",
}: TitledWindowProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "w-full",
  };

  const variantClasses = {
    default: "card",
    elevated: "card shadow-2xl shadow-purple-500/10",
    glass: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Icon or Thinking Indicator */}
          <div className="relative">
            {isThinking ? (
              <ThinkingIndicator />
            ) : (
              icon || <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col">
            <h3 className="font-semibold text-white">
              {isThinking ? thinkingText : title}
            </h3>
            {isThinking && (
              <span className="text-xs text-white/50 animate-pulse">
                Processing your request...
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {headerActions}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-white/50 hover:text-white" />
            </button>
          )}
          {onMaximize && (
            <button
              onClick={onMaximize}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Maximize"
            >
              <Maximize2 className="w-4 h-4 text-white/50 hover:text-white" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/50 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Thinking Progress Bar */}
      {isThinking && (
        <div className="h-0.5 bg-white/5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-thinking-progress" />
        </div>
      )}

      {/* Content */}
      <div className={`p-4 ${isThinking ? "opacity-70" : ""}`}>
        {children}
      </div>
    </div>
  );
}

// Animated thinking indicator with brain icon
function ThinkingIndicator() {
  return (
    <div className="relative w-8 h-8">
      {/* Pulsing background */}
      <div className="absolute inset-0 bg-purple-500/30 rounded-lg animate-ping" />

      {/* Rotating ring */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent border-t-purple-500 animate-spin" />

      {/* Brain icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
      </div>

      {/* Sparkle effects */}
      <div className="absolute -top-1 -right-1">
        <Sparkles className="w-3 h-3 text-pink-400 animate-bounce" />
      </div>
    </div>
  );
}

// Standalone thinking card for full-page thinking states
export function ThinkingWindow({
  title = "Processing",
  steps,
  currentStep = 0,
  className = "",
}: {
  title?: string;
  steps?: string[];
  currentStep?: number;
  className?: string;
}) {
  return (
    <TitledWindow
      title={title}
      isThinking={true}
      thinkingText="Overthinking..."
      variant="elevated"
      size="md"
      className={className}
    >
      <div className="space-y-4">
        {/* Animated thinking visualization */}
        <div className="flex justify-center py-6">
          <div className="relative">
            {/* Multiple orbiting dots */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-purple-500 rounded-full"
                style={{
                  animation: `orbit 2s linear infinite`,
                  animationDelay: `${i * 0.3}s`,
                  transformOrigin: "center",
                }}
              />
            ))}

            {/* Center brain */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Steps progress */}
        {steps && steps.length > 0 && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  index === currentStep
                    ? "bg-purple-500/20 text-white"
                    : index < currentStep
                    ? "text-white/50"
                    : "text-white/30"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    index === currentStep
                      ? "bg-purple-500 text-white"
                      : index < currentStep
                      ? "bg-white/20 text-white/50"
                      : "bg-white/10 text-white/30"
                  }`}
                >
                  {index < currentStep ? "✓" : index === currentStep ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={index === currentStep ? "font-medium" : ""}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Thinking dots */}
        <div className="flex items-center justify-center gap-1 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </TitledWindow>
  );
}

// Compact inline thinking indicator
export function InlineThinking({ text = "Thinking..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-white/50 text-sm">
      <div className="relative w-4 h-4">
        <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
        <Brain className="absolute inset-0 w-4 h-4 text-purple-400/50" />
      </div>
      <span className="animate-pulse">{text}</span>
    </div>
  );
}
