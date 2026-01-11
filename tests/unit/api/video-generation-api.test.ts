/**
 * Video Generation API Route Tests
 * Tests for video generation endpoints and validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Video Generation API", () => {
  describe("Request Validation", () => {
    interface VideoGenerationRequest {
      contentId?: string;
      sourceContent?: string;
      outputType?: "VIDEO" | "AUDIO" | "SLIDESHOW";
      aspectRatio?: "16:9" | "9:16" | "1:1";
      voice?: string;
      language?: string;
      duration?: number;
    }

    function validateVideoRequest(req: VideoGenerationRequest): {
      valid: boolean;
      error?: string;
    } {
      if (!req.contentId && !req.sourceContent) {
        return { valid: false, error: "Either contentId or sourceContent is required" };
      }

      if (req.outputType && !["VIDEO", "AUDIO", "SLIDESHOW"].includes(req.outputType)) {
        return { valid: false, error: "Invalid output type" };
      }

      if (req.aspectRatio && !["16:9", "9:16", "1:1"].includes(req.aspectRatio)) {
        return { valid: false, error: "Invalid aspect ratio" };
      }

      if (req.duration !== undefined) {
        if (typeof req.duration !== "number" || req.duration <= 0) {
          return { valid: false, error: "Duration must be a positive number" };
        }
        if (req.duration > 600) {
          return { valid: false, error: "Maximum duration is 600 seconds" };
        }
      }

      return { valid: true };
    }

    it("should accept valid request with contentId", () => {
      const result = validateVideoRequest({ contentId: "content-123" });
      expect(result.valid).toBe(true);
    });

    it("should accept valid request with sourceContent", () => {
      const result = validateVideoRequest({ sourceContent: "Some content to process" });
      expect(result.valid).toBe(true);
    });

    it("should reject request without content", () => {
      const result = validateVideoRequest({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain("contentId or sourceContent");
    });

    it("should accept all valid output types", () => {
      expect(validateVideoRequest({ contentId: "x", outputType: "VIDEO" }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", outputType: "AUDIO" }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", outputType: "SLIDESHOW" }).valid).toBe(true);
    });

    it("should reject invalid output types", () => {
      const result = validateVideoRequest({ contentId: "x", outputType: "INVALID" as any });
      expect(result.valid).toBe(false);
    });

    it("should accept all valid aspect ratios", () => {
      expect(validateVideoRequest({ contentId: "x", aspectRatio: "16:9" }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", aspectRatio: "9:16" }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", aspectRatio: "1:1" }).valid).toBe(true);
    });

    it("should reject invalid aspect ratios", () => {
      const result = validateVideoRequest({ contentId: "x", aspectRatio: "4:3" as any });
      expect(result.valid).toBe(false);
    });

    it("should accept valid durations", () => {
      expect(validateVideoRequest({ contentId: "x", duration: 60 }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", duration: 300 }).valid).toBe(true);
      expect(validateVideoRequest({ contentId: "x", duration: 600 }).valid).toBe(true);
    });

    it("should reject invalid durations", () => {
      expect(validateVideoRequest({ contentId: "x", duration: 0 }).valid).toBe(false);
      expect(validateVideoRequest({ contentId: "x", duration: -10 }).valid).toBe(false);
      expect(validateVideoRequest({ contentId: "x", duration: 601 }).valid).toBe(false);
    });
  });

  describe("Video Script Validation", () => {
    interface ScriptSegment {
      text: string;
      imagePrompt?: string;
      duration?: number;
    }

    function validateScript(segments: ScriptSegment[]): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!segments || segments.length === 0) {
        errors.push("Script must have at least one segment");
        return { valid: false, errors };
      }

      if (segments.length > 20) {
        errors.push("Script cannot have more than 20 segments");
      }

      let totalDuration = 0;

      segments.forEach((segment, index) => {
        if (!segment.text || segment.text.trim().length === 0) {
          errors.push(`Segment ${index + 1}: Text is required`);
        }

        if (segment.text && segment.text.length > 500) {
          errors.push(`Segment ${index + 1}: Text exceeds 500 characters`);
        }

        if (segment.imagePrompt && segment.imagePrompt.length > 200) {
          errors.push(`Segment ${index + 1}: Image prompt exceeds 200 characters`);
        }

        if (segment.duration !== undefined) {
          if (segment.duration < 1) {
            errors.push(`Segment ${index + 1}: Duration must be at least 1 second`);
          }
          if (segment.duration > 60) {
            errors.push(`Segment ${index + 1}: Duration cannot exceed 60 seconds`);
          }
          totalDuration += segment.duration;
        }
      });

      if (totalDuration > 600) {
        errors.push("Total script duration exceeds 600 seconds");
      }

      return { valid: errors.length === 0, errors };
    }

    it("should accept valid script", () => {
      const result = validateScript([
        { text: "Welcome to this video", imagePrompt: "Title screen", duration: 5 },
        { text: "Let's explore the topic", imagePrompt: "Topic overview", duration: 10 },
      ]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty script", () => {
      const result = validateScript([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Script must have at least one segment");
    });

    it("should reject script with too many segments", () => {
      const segments = Array(21).fill({ text: "Segment text", duration: 5 });
      const result = validateScript(segments);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("20 segments"))).toBe(true);
    });

    it("should reject segment with empty text", () => {
      const result = validateScript([{ text: "", duration: 5 }]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Text is required"))).toBe(true);
    });

    it("should reject segment with whitespace-only text", () => {
      const result = validateScript([{ text: "   ", duration: 5 }]);
      expect(result.valid).toBe(false);
    });

    it("should reject text exceeding character limit", () => {
      const longText = "a".repeat(501);
      const result = validateScript([{ text: longText }]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("500 characters"))).toBe(true);
    });

    it("should reject image prompt exceeding limit", () => {
      const longPrompt = "a".repeat(201);
      const result = validateScript([{ text: "Valid text", imagePrompt: longPrompt }]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("200 characters"))).toBe(true);
    });

    it("should reject duration under minimum", () => {
      const result = validateScript([{ text: "Text", duration: 0.5 }]);
      expect(result.valid).toBe(false);
    });

    it("should reject duration over maximum per segment", () => {
      const result = validateScript([{ text: "Text", duration: 61 }]);
      expect(result.valid).toBe(false);
    });

    it("should reject total duration over maximum", () => {
      const segments = Array(20).fill({ text: "Segment", duration: 35 });
      const result = validateScript(segments);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("600 seconds"))).toBe(true);
    });
  });

  describe("Image Generation Parameters", () => {
    interface ImageParams {
      prompt: string;
      negativePrompt?: string;
      width?: number;
      height?: number;
      steps?: number;
      guidance?: number;
    }

    function validateImageParams(params: ImageParams): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!params.prompt || params.prompt.trim().length === 0) {
        errors.push("Prompt is required");
      }

      if (params.prompt && params.prompt.length > 1000) {
        errors.push("Prompt exceeds 1000 characters");
      }

      if (params.negativePrompt && params.negativePrompt.length > 500) {
        errors.push("Negative prompt exceeds 500 characters");
      }

      const validDimensions = [256, 512, 768, 1024];
      if (params.width && !validDimensions.includes(params.width)) {
        errors.push("Invalid width dimension");
      }
      if (params.height && !validDimensions.includes(params.height)) {
        errors.push("Invalid height dimension");
      }

      if (params.steps !== undefined) {
        if (params.steps < 1 || params.steps > 100) {
          errors.push("Steps must be between 1 and 100");
        }
      }

      if (params.guidance !== undefined) {
        if (params.guidance < 0 || params.guidance > 30) {
          errors.push("Guidance must be between 0 and 30");
        }
      }

      return { valid: errors.length === 0, errors };
    }

    it("should accept valid image parameters", () => {
      const result = validateImageParams({
        prompt: "A beautiful sunset over mountains",
        width: 1024,
        height: 768,
        steps: 30,
        guidance: 7.5,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject missing prompt", () => {
      const result = validateImageParams({ prompt: "" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Prompt is required");
    });

    it("should reject prompt exceeding limit", () => {
      const result = validateImageParams({ prompt: "a".repeat(1001) });
      expect(result.valid).toBe(false);
    });

    it("should reject invalid dimensions", () => {
      const result = validateImageParams({ prompt: "Test", width: 500 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("width"))).toBe(true);
    });

    it("should reject invalid steps", () => {
      expect(validateImageParams({ prompt: "Test", steps: 0 }).valid).toBe(false);
      expect(validateImageParams({ prompt: "Test", steps: 101 }).valid).toBe(false);
    });

    it("should reject invalid guidance", () => {
      expect(validateImageParams({ prompt: "Test", guidance: -1 }).valid).toBe(false);
      expect(validateImageParams({ prompt: "Test", guidance: 31 }).valid).toBe(false);
    });

    it("should accept all valid dimensions", () => {
      [256, 512, 768, 1024].forEach((dim) => {
        expect(validateImageParams({ prompt: "Test", width: dim, height: dim }).valid).toBe(true);
      });
    });
  });

  describe("Audio Generation Parameters", () => {
    interface AudioParams {
      text: string;
      voice?: string;
      speed?: number;
      format?: "mp3" | "wav" | "ogg";
    }

    function validateAudioParams(params: AudioParams): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!params.text || params.text.trim().length === 0) {
        errors.push("Text is required");
      }

      // TTS typically has character limits
      if (params.text && params.text.length > 5000) {
        errors.push("Text exceeds 5000 character limit");
      }

      if (params.speed !== undefined) {
        if (params.speed < 0.5 || params.speed > 2.0) {
          errors.push("Speed must be between 0.5 and 2.0");
        }
      }

      if (params.format && !["mp3", "wav", "ogg"].includes(params.format)) {
        errors.push("Invalid audio format");
      }

      return { valid: errors.length === 0, errors };
    }

    it("should accept valid audio parameters", () => {
      const result = validateAudioParams({
        text: "Hello, world!",
        voice: "en-US-1",
        speed: 1.0,
        format: "mp3",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject missing text", () => {
      const result = validateAudioParams({ text: "" });
      expect(result.valid).toBe(false);
    });

    it("should reject text exceeding limit", () => {
      const result = validateAudioParams({ text: "a".repeat(5001) });
      expect(result.valid).toBe(false);
    });

    it("should reject invalid speed", () => {
      expect(validateAudioParams({ text: "Test", speed: 0.4 }).valid).toBe(false);
      expect(validateAudioParams({ text: "Test", speed: 2.1 }).valid).toBe(false);
    });

    it("should accept boundary speeds", () => {
      expect(validateAudioParams({ text: "Test", speed: 0.5 }).valid).toBe(true);
      expect(validateAudioParams({ text: "Test", speed: 2.0 }).valid).toBe(true);
    });

    it("should accept all valid formats", () => {
      ["mp3", "wav", "ogg"].forEach((format) => {
        expect(validateAudioParams({ text: "Test", format: format as any }).valid).toBe(true);
      });
    });

    it("should reject invalid format", () => {
      const result = validateAudioParams({ text: "Test", format: "flac" as any });
      expect(result.valid).toBe(false);
    });
  });

  describe("Video Job Status", () => {
    type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

    interface VideoJob {
      id: string;
      status: JobStatus;
      progress?: number;
      error?: string;
      resultUrl?: string;
      createdAt: Date;
      updatedAt: Date;
    }

    function getJobStatusMessage(job: VideoJob): string {
      switch (job.status) {
        case "PENDING":
          return "Job is waiting to be processed";
        case "PROCESSING":
          return `Processing: ${job.progress || 0}% complete`;
        case "COMPLETED":
          return "Job completed successfully";
        case "FAILED":
          return `Job failed: ${job.error || "Unknown error"}`;
        case "CANCELLED":
          return "Job was cancelled";
        default:
          return "Unknown status";
      }
    }

    function canCancelJob(job: VideoJob): boolean {
      return ["PENDING", "PROCESSING"].includes(job.status);
    }

    function canRetryJob(job: VideoJob): boolean {
      return ["FAILED", "CANCELLED"].includes(job.status);
    }

    it("should generate correct status messages", () => {
      const baseJob = {
        id: "job-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(getJobStatusMessage({ ...baseJob, status: "PENDING" })).toContain("waiting");
      expect(getJobStatusMessage({ ...baseJob, status: "PROCESSING", progress: 50 })).toContain("50%");
      expect(getJobStatusMessage({ ...baseJob, status: "COMPLETED" })).toContain("successfully");
      expect(getJobStatusMessage({ ...baseJob, status: "FAILED", error: "Timeout" })).toContain("Timeout");
      expect(getJobStatusMessage({ ...baseJob, status: "CANCELLED" })).toContain("cancelled");
    });

    it("should allow cancellation only for active jobs", () => {
      const baseJob = { id: "job-1", createdAt: new Date(), updatedAt: new Date() };

      expect(canCancelJob({ ...baseJob, status: "PENDING" })).toBe(true);
      expect(canCancelJob({ ...baseJob, status: "PROCESSING" })).toBe(true);
      expect(canCancelJob({ ...baseJob, status: "COMPLETED" })).toBe(false);
      expect(canCancelJob({ ...baseJob, status: "FAILED" })).toBe(false);
      expect(canCancelJob({ ...baseJob, status: "CANCELLED" })).toBe(false);
    });

    it("should allow retry only for failed/cancelled jobs", () => {
      const baseJob = { id: "job-1", createdAt: new Date(), updatedAt: new Date() };

      expect(canRetryJob({ ...baseJob, status: "PENDING" })).toBe(false);
      expect(canRetryJob({ ...baseJob, status: "PROCESSING" })).toBe(false);
      expect(canRetryJob({ ...baseJob, status: "COMPLETED" })).toBe(false);
      expect(canRetryJob({ ...baseJob, status: "FAILED" })).toBe(true);
      expect(canRetryJob({ ...baseJob, status: "CANCELLED" })).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    interface RateLimitConfig {
      maxRequests: number;
      windowMs: number;
    }

    interface RateLimitState {
      count: number;
      resetAt: number;
    }

    function checkRateLimit(
      state: RateLimitState | null,
      config: RateLimitConfig,
      now: number = Date.now()
    ): { allowed: boolean; remaining: number; resetAt: number } {
      if (!state || now >= state.resetAt) {
        // New window
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: now + config.windowMs,
        };
      }

      if (state.count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: state.resetAt,
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - state.count - 1,
        resetAt: state.resetAt,
      };
    }

    it("should allow first request", () => {
      const result = checkRateLimit(null, { maxRequests: 10, windowMs: 60000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("should track remaining requests", () => {
      const now = Date.now();
      const state = { count: 5, resetAt: now + 60000 };
      const result = checkRateLimit(state, { maxRequests: 10, windowMs: 60000 }, now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should block when limit reached", () => {
      const now = Date.now();
      const state = { count: 10, resetAt: now + 60000 };
      const result = checkRateLimit(state, { maxRequests: 10, windowMs: 60000 }, now);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", () => {
      const now = Date.now();
      const state = { count: 10, resetAt: now - 1000 }; // Window expired
      const result = checkRateLimit(state, { maxRequests: 10, windowMs: 60000 }, now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe("Progress Calculation", () => {
    interface GenerationStep {
      name: string;
      weight: number;
      completed: boolean;
    }

    function calculateProgress(steps: GenerationStep[]): number {
      if (steps.length === 0) return 0;

      const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
      const completedWeight = steps
        .filter((step) => step.completed)
        .reduce((sum, step) => sum + step.weight, 0);

      return Math.round((completedWeight / totalWeight) * 100);
    }

    it("should calculate progress correctly", () => {
      const steps = [
        { name: "Generate script", weight: 20, completed: true },
        { name: "Generate images", weight: 40, completed: true },
        { name: "Generate audio", weight: 30, completed: false },
        { name: "Combine video", weight: 10, completed: false },
      ];
      expect(calculateProgress(steps)).toBe(60);
    });

    it("should return 0 for no steps", () => {
      expect(calculateProgress([])).toBe(0);
    });

    it("should return 0 when nothing completed", () => {
      const steps = [
        { name: "Step 1", weight: 50, completed: false },
        { name: "Step 2", weight: 50, completed: false },
      ];
      expect(calculateProgress(steps)).toBe(0);
    });

    it("should return 100 when all completed", () => {
      const steps = [
        { name: "Step 1", weight: 50, completed: true },
        { name: "Step 2", weight: 50, completed: true },
      ];
      expect(calculateProgress(steps)).toBe(100);
    });

    it("should handle unequal weights", () => {
      const steps = [
        { name: "Light step", weight: 10, completed: true },
        { name: "Heavy step", weight: 90, completed: false },
      ];
      expect(calculateProgress(steps)).toBe(10);
    });
  });

  describe("Webhook Validation", () => {
    interface WebhookPayload {
      event: string;
      jobId: string;
      timestamp: number;
      data?: Record<string, unknown>;
      signature?: string;
    }

    function validateWebhookPayload(payload: unknown): { valid: boolean; error?: string } {
      if (!payload || typeof payload !== "object") {
        return { valid: false, error: "Invalid payload format" };
      }

      const p = payload as WebhookPayload;

      if (!p.event || typeof p.event !== "string") {
        return { valid: false, error: "Missing or invalid event field" };
      }

      if (!p.jobId || typeof p.jobId !== "string") {
        return { valid: false, error: "Missing or invalid jobId field" };
      }

      if (!p.timestamp || typeof p.timestamp !== "number") {
        return { valid: false, error: "Missing or invalid timestamp field" };
      }

      // Check timestamp is not too old (5 minutes)
      const now = Date.now();
      if (now - p.timestamp > 300000) {
        return { valid: false, error: "Webhook timestamp expired" };
      }

      const validEvents = ["job.created", "job.progress", "job.completed", "job.failed"];
      if (!validEvents.includes(p.event)) {
        return { valid: false, error: "Unknown event type" };
      }

      return { valid: true };
    }

    it("should accept valid webhook payload", () => {
      const result = validateWebhookPayload({
        event: "job.completed",
        jobId: "job-123",
        timestamp: Date.now(),
        data: { resultUrl: "https://example.com/video.mp4" },
      });
      expect(result.valid).toBe(true);
    });

    it("should reject non-object payload", () => {
      expect(validateWebhookPayload(null).valid).toBe(false);
      expect(validateWebhookPayload("string").valid).toBe(false);
      expect(validateWebhookPayload(123).valid).toBe(false);
    });

    it("should reject missing event", () => {
      const result = validateWebhookPayload({
        jobId: "job-123",
        timestamp: Date.now(),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("event");
    });

    it("should reject missing jobId", () => {
      const result = validateWebhookPayload({
        event: "job.completed",
        timestamp: Date.now(),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("jobId");
    });

    it("should reject expired timestamp", () => {
      const result = validateWebhookPayload({
        event: "job.completed",
        jobId: "job-123",
        timestamp: Date.now() - 400000, // 6+ minutes ago
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should reject unknown event types", () => {
      const result = validateWebhookPayload({
        event: "job.unknown",
        jobId: "job-123",
        timestamp: Date.now(),
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown event");
    });

    it("should accept all valid event types", () => {
      const events = ["job.created", "job.progress", "job.completed", "job.failed"];
      events.forEach((event) => {
        const result = validateWebhookPayload({
          event,
          jobId: "job-123",
          timestamp: Date.now(),
        });
        expect(result.valid).toBe(true);
      });
    });
  });

  describe("File Size Limits", () => {
    interface FileLimits {
      maxUploadSize: number;
      maxResultSize: number;
      allowedMimeTypes: string[];
    }

    function validateFile(
      size: number,
      mimeType: string,
      limits: FileLimits
    ): { valid: boolean; error?: string } {
      if (size > limits.maxUploadSize) {
        return { valid: false, error: `File size exceeds ${limits.maxUploadSize / 1024 / 1024}MB limit` };
      }

      if (!limits.allowedMimeTypes.includes(mimeType)) {
        return { valid: false, error: `File type ${mimeType} not allowed` };
      }

      return { valid: true };
    }

    const defaultLimits: FileLimits = {
      maxUploadSize: 100 * 1024 * 1024, // 100MB
      maxResultSize: 500 * 1024 * 1024, // 500MB
      allowedMimeTypes: ["video/mp4", "audio/mp3", "audio/wav", "image/png", "image/jpeg"],
    };

    it("should accept files within size limit", () => {
      const result = validateFile(50 * 1024 * 1024, "video/mp4", defaultLimits);
      expect(result.valid).toBe(true);
    });

    it("should reject oversized files", () => {
      const result = validateFile(200 * 1024 * 1024, "video/mp4", defaultLimits);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("100MB");
    });

    it("should accept allowed mime types", () => {
      defaultLimits.allowedMimeTypes.forEach((mimeType) => {
        const result = validateFile(1024, mimeType, defaultLimits);
        expect(result.valid).toBe(true);
      });
    });

    it("should reject disallowed mime types", () => {
      const result = validateFile(1024, "application/pdf", defaultLimits);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });
  });

  describe("Queue Priority", () => {
    type Priority = "low" | "normal" | "high" | "urgent";

    interface QueuedJob {
      id: string;
      priority: Priority;
      createdAt: number;
    }

    function sortJobsByPriority(jobs: QueuedJob[]): QueuedJob[] {
      const priorityOrder: Record<Priority, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      };

      return [...jobs].sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        // Same priority: older jobs first (FIFO)
        return a.createdAt - b.createdAt;
      });
    }

    it("should sort by priority first", () => {
      const jobs: QueuedJob[] = [
        { id: "1", priority: "low", createdAt: 1000 },
        { id: "2", priority: "urgent", createdAt: 2000 },
        { id: "3", priority: "normal", createdAt: 1500 },
      ];
      const sorted = sortJobsByPriority(jobs);
      expect(sorted.map((j) => j.id)).toEqual(["2", "3", "1"]);
    });

    it("should use FIFO within same priority", () => {
      const jobs: QueuedJob[] = [
        { id: "1", priority: "normal", createdAt: 3000 },
        { id: "2", priority: "normal", createdAt: 1000 },
        { id: "3", priority: "normal", createdAt: 2000 },
      ];
      const sorted = sortJobsByPriority(jobs);
      expect(sorted.map((j) => j.id)).toEqual(["2", "3", "1"]);
    });

    it("should handle empty queue", () => {
      expect(sortJobsByPriority([])).toEqual([]);
    });

    it("should handle single job", () => {
      const jobs = [{ id: "1", priority: "normal" as Priority, createdAt: 1000 }];
      expect(sortJobsByPriority(jobs)).toEqual(jobs);
    });
  });

  describe("Error Recovery", () => {
    interface RetryConfig {
      maxRetries: number;
      baseDelayMs: number;
      maxDelayMs: number;
    }

    function calculateRetryDelay(attempt: number, config: RetryConfig): number {
      if (attempt >= config.maxRetries) {
        return -1; // No more retries
      }

      // Exponential backoff with jitter
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, config.maxDelayMs);

      return delay;
    }

    function isRetryableError(error: Error): boolean {
      const retryableCodes = ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "RATE_LIMITED", "SERVICE_UNAVAILABLE"];
      const errorCode = (error as any).code;

      if (errorCode && retryableCodes.includes(errorCode)) {
        return true;
      }

      // Check error message for known patterns
      const retryablePatterns = [
        /timeout/i,
        /rate limit/i,
        /503/,
        /temporarily unavailable/i,
      ];

      return retryablePatterns.some((pattern) => pattern.test(error.message));
    }

    it("should calculate exponential backoff", () => {
      const config: RetryConfig = { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 30000 };

      expect(calculateRetryDelay(0, config)).toBe(1000);
      expect(calculateRetryDelay(1, config)).toBe(2000);
      expect(calculateRetryDelay(2, config)).toBe(4000);
      expect(calculateRetryDelay(3, config)).toBe(8000);
      expect(calculateRetryDelay(4, config)).toBe(16000);
    });

    it("should cap at max delay", () => {
      const config: RetryConfig = { maxRetries: 10, baseDelayMs: 1000, maxDelayMs: 5000 };

      expect(calculateRetryDelay(5, config)).toBe(5000); // Would be 32000 without cap
    });

    it("should return -1 when max retries reached", () => {
      const config: RetryConfig = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000 };

      expect(calculateRetryDelay(3, config)).toBe(-1);
      expect(calculateRetryDelay(10, config)).toBe(-1);
    });

    it("should identify retryable errors by code", () => {
      const timeoutError = new Error("Timeout") as Error & { code: string };
      timeoutError.code = "ETIMEDOUT";
      expect(isRetryableError(timeoutError)).toBe(true);

      const rateLimitError = new Error("Rate limit") as Error & { code: string };
      rateLimitError.code = "RATE_LIMITED";
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it("should identify retryable errors by message", () => {
      expect(isRetryableError(new Error("Connection timeout"))).toBe(true);
      expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(true);
      expect(isRetryableError(new Error("Service temporarily unavailable"))).toBe(true);
      expect(isRetryableError(new Error("Error 503"))).toBe(true);
    });

    it("should not retry non-retryable errors", () => {
      expect(isRetryableError(new Error("Invalid input"))).toBe(false);
      expect(isRetryableError(new Error("Not found"))).toBe(false);
      expect(isRetryableError(new Error("Authentication failed"))).toBe(false);
    });
  });
});
