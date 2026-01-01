import { prisma } from '@/lib/prisma';
import {
  ModerationContentType,
  ModerationStatus,
  ModerationDecision,
  ContentModerationReport,
  UserModerationStatus,
  Prisma,
} from '@prisma/client';
import {
  ModerationResult,
  ModerationInput,
  AICheckResult,
  Violation,
  ViolationCategory,
  WorkerModerationResponse,
  VIOLATION_SUGGESTIONS,
} from './types';
import {
  CONTENT_TYPE_CONFIG,
  AI_CONFIG,
  MODERATION_PROMPT,
  PENALTY_CONFIG,
} from './config';

export class ContentModerationService {
  /**
   * Main moderation method - checks content and returns decision
   */
  async moderate(input: ModerationInput): Promise<ModerationResult> {
    const { content, contentType, userId, contentId } = input;
    const config = CONTENT_TYPE_CONFIG[contentType];

    // Get AI check result
    let aiResult: AICheckResult;
    try {
      aiResult = await this.checkWithWorker(content);
    } catch (error) {
      console.error('Worker check failed, trying OpenAI fallback:', error);
      aiResult = await this.checkWithOpenAI(content);
    }

    // Extract violations from AI result
    const violations = this.extractViolations(aiResult);
    const confidenceScore = this.getMaxConfidence(violations);

    // Determine moderation status based on confidence and config
    const status = this.determineStatus(confidenceScore, config);
    const approved = status === ModerationStatus.AUTO_APPROVED;
    const requiresReview = status === ModerationStatus.MANUAL_REVIEW;

    // Create moderation report
    const report = await this.createReport({
      contentType,
      contentId: contentId || `pending-${Date.now()}`,
      userId,
      originalContent: content,
      status,
      violations,
      confidenceScore,
      aiModelVersion: aiResult.modelVersion,
    });

    // Update user moderation history
    await this.updateUserHistory(userId, status, violations.length > 0);

    return {
      approved,
      requiresReview,
      violations,
      confidenceScore,
      status,
      report,
    };
  }

  /**
   * Check content using Cloudflare Workers AI
   */
  async checkWithWorker(content: string): Promise<AICheckResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

    try {
      const response = await fetch(`${AI_CONFIG.workerUrl}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, prompt: MODERATION_PROMPT }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Worker responded with ${response.status}`);
      }

      const data: WorkerModerationResponse = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || 'Worker moderation failed');
      }

      return {
        ...data.result,
        modelVersion: AI_CONFIG.modelVersion,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fallback to OpenAI Moderation API
   */
  async checkWithOpenAI(content: string): Promise<AICheckResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: content,
        model: AI_CONFIG.openAIModelVersion,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI moderation failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    // Map OpenAI categories to our categories
    return {
      flagged: result.flagged,
      categories: {
        hate: result.categories.hate || result.categories['hate/threatening'],
        harassment: result.categories.harassment || result.categories['harassment/threatening'],
        violence: result.categories.violence || result.categories['violence/graphic'],
        sexual: result.categories.sexual || result.categories['sexual/minors'],
        'self-harm':
          result.categories['self-harm'] ||
          result.categories['self-harm/intent'] ||
          result.categories['self-harm/instructions'],
        spam: false, // OpenAI doesn't detect spam
        misinformation: false, // OpenAI doesn't detect misinformation
      },
      categoryScores: {
        hate: Math.max(
          result.category_scores.hate || 0,
          result.category_scores['hate/threatening'] || 0
        ) * 100,
        harassment: Math.max(
          result.category_scores.harassment || 0,
          result.category_scores['harassment/threatening'] || 0
        ) * 100,
        violence: Math.max(
          result.category_scores.violence || 0,
          result.category_scores['violence/graphic'] || 0
        ) * 100,
        sexual: Math.max(
          result.category_scores.sexual || 0,
          result.category_scores['sexual/minors'] || 0
        ) * 100,
        'self-harm': Math.max(
          result.category_scores['self-harm'] || 0,
          result.category_scores['self-harm/intent'] || 0,
          result.category_scores['self-harm/instructions'] || 0
        ) * 100,
        spam: 0,
        misinformation: 0,
      },
      modelVersion: AI_CONFIG.openAIModelVersion,
    };
  }

  /**
   * Extract violations from AI check result
   */
  private extractViolations(result: AICheckResult): Violation[] {
    const violations: Violation[] = [];
    const categories = Object.keys(result.categories) as ViolationCategory[];

    for (const category of categories) {
      if (result.categories[category]) {
        const confidence = result.categoryScores[category];
        violations.push({
          category,
          confidence,
          details: VIOLATION_SUGGESTIONS[category],
        });
      }
    }

    // Sort by confidence (highest first)
    return violations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get maximum confidence score from violations
   */
  private getMaxConfidence(violations: Violation[]): number {
    if (violations.length === 0) return 0;
    return Math.max(...violations.map((v) => v.confidence));
  }

  /**
   * Determine moderation status based on confidence and config
   */
  private determineStatus(
    confidence: number,
    config: typeof CONTENT_TYPE_CONFIG[ModerationContentType]
  ): ModerationStatus {
    if (confidence >= config.autoRejectThreshold) {
      return ModerationStatus.AUTO_REJECTED;
    }
    if (confidence >= config.manualReviewThreshold) {
      return ModerationStatus.MANUAL_REVIEW;
    }
    return ModerationStatus.AUTO_APPROVED;
  }

  /**
   * Create moderation report in database
   */
  private async createReport(data: {
    contentType: ModerationContentType;
    contentId: string;
    userId: string;
    originalContent: string;
    status: ModerationStatus;
    violations: Violation[];
    confidenceScore: number;
    aiModelVersion: string;
  }): Promise<ContentModerationReport> {
    // Determine decision based on status
    let decision: ModerationDecision | null = null;
    if (data.status === ModerationStatus.AUTO_APPROVED) {
      decision = ModerationDecision.APPROVED;
    } else if (data.status === ModerationStatus.AUTO_REJECTED) {
      decision = ModerationDecision.REJECTED;
    }

    return prisma.contentModerationReport.create({
      data: {
        contentType: data.contentType,
        contentId: data.contentId,
        userId: data.userId,
        originalContent: data.originalContent,
        status: data.status,
        decision,
        violations: data.violations as unknown as Prisma.InputJsonValue,
        confidenceScore: data.confidenceScore,
        aiModelVersion: data.aiModelVersion,
        resolvedAt: decision ? new Date() : null,
      },
    });
  }

  /**
   * Update user moderation history
   */
  private async updateUserHistory(
    userId: string,
    status: ModerationStatus,
    hasViolations: boolean
  ): Promise<void> {
    const isRejected = status === ModerationStatus.AUTO_REJECTED;
    const isApproved = status === ModerationStatus.AUTO_APPROVED;

    // Upsert user moderation history
    await prisma.userModerationHistory.upsert({
      where: { userId },
      create: {
        userId,
        totalReports: 1,
        approvedCount: isApproved ? 1 : 0,
        rejectedCount: isRejected ? 1 : 0,
        warningCount: 0,
        lastViolation: hasViolations ? new Date() : null,
        currentStatus: UserModerationStatus.GOOD_STANDING,
      },
      update: {
        totalReports: { increment: 1 },
        approvedCount: isApproved ? { increment: 1 } : undefined,
        rejectedCount: isRejected ? { increment: 1 } : undefined,
        lastViolation: hasViolations ? new Date() : undefined,
      },
    });

    // Check if user should be penalized
    if (isRejected) {
      await this.checkAndApplyPenalty(userId);
    }
  }

  /**
   * Check and apply penalties based on violation count
   */
  private async checkAndApplyPenalty(userId: string): Promise<void> {
    const history = await prisma.userModerationHistory.findUnique({
      where: { userId },
    });

    if (!history) return;

    const { rejectedCount } = history;
    let newStatus: UserModerationStatus = history.currentStatus;
    let muteExpiresAt: Date | null = null;

    if (rejectedCount >= PENALTY_CONFIG.reviewThreshold) {
      newStatus = UserModerationStatus.UNDER_REVIEW;
    } else if (rejectedCount >= PENALTY_CONFIG.muteThreshold) {
      newStatus = UserModerationStatus.MUTED;
      muteExpiresAt = new Date(
        Date.now() + PENALTY_CONFIG.muteDurationMinutes * 60 * 1000
      );
    } else if (rejectedCount >= PENALTY_CONFIG.warningThreshold) {
      newStatus = UserModerationStatus.WARNING;
    }

    if (newStatus !== history.currentStatus) {
      await prisma.userModerationHistory.update({
        where: { userId },
        data: {
          currentStatus: newStatus,
          warningCount:
            newStatus === UserModerationStatus.WARNING
              ? { increment: 1 }
              : undefined,
          muteExpiresAt,
        },
      });

      // TODO: Send notification to user about status change
    }
  }

  /**
   * Check if user is muted
   */
  async isUserMuted(userId: string): Promise<boolean> {
    const history = await prisma.userModerationHistory.findUnique({
      where: { userId },
    });

    if (!history) return false;

    if (history.currentStatus === UserModerationStatus.MUTED) {
      // Check if mute has expired
      if (history.muteExpiresAt && history.muteExpiresAt < new Date()) {
        // Mute expired, reset status
        await prisma.userModerationHistory.update({
          where: { userId },
          data: {
            currentStatus: UserModerationStatus.GOOD_STANDING,
            muteExpiresAt: null,
          },
        });
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Get moderation report by ID
   */
  async getReport(reportId: string): Promise<ContentModerationReport | null> {
    return prisma.contentModerationReport.findUnique({
      where: { id: reportId },
    });
  }

  /**
   * Update report with admin decision
   */
  async updateReportDecision(
    reportId: string,
    decision: ModerationDecision,
    reviewerId: string,
    notes?: string
  ): Promise<ContentModerationReport> {
    const status =
      decision === ModerationDecision.APPROVED
        ? ModerationStatus.APPROVED
        : ModerationStatus.REJECTED;

    return prisma.contentModerationReport.update({
      where: { id: reportId },
      data: {
        status,
        decision,
        reviewerId,
        reviewNotes: notes,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Submit appeal for a moderation decision
   */
  async submitAppeal(
    reportId: string,
    userId: string,
    reason: string
  ): Promise<ContentModerationReport> {
    const report = await this.getReport(reportId);

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== userId) {
      throw new Error('Not authorized to appeal this report');
    }

    if (report.status === ModerationStatus.APPEALED) {
      throw new Error('Report already appealed');
    }

    return prisma.contentModerationReport.update({
      where: { id: reportId },
      data: {
        status: ModerationStatus.APPEALED,
        appealReason: reason,
        appealedAt: new Date(),
      },
    });
  }
}

// Export singleton instance
export const moderationService = new ContentModerationService();
