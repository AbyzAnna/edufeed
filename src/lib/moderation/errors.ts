import { Violation, ViolationCategory, VIOLATION_SUGGESTIONS, ContentBlockedResponse } from './types';

/**
 * Error thrown when content is blocked by moderation
 */
export class ContentBlockedError extends Error {
  public readonly violations: Violation[];
  public readonly reportId: string;
  public readonly canAppeal: boolean;

  constructor(violations: Violation[], reportId: string, canAppeal = true) {
    const primaryViolation = violations[0];
    const message = primaryViolation
      ? `Content blocked due to ${primaryViolation.category} violation`
      : 'Content blocked due to policy violation';

    super(message);
    this.name = 'ContentBlockedError';
    this.violations = violations;
    this.reportId = reportId;
    this.canAppeal = canAppeal;
  }

  /**
   * Convert error to API response format
   */
  toResponse(): ContentBlockedResponse {
    return {
      error: 'CONTENT_BLOCKED',
      message: this.message,
      violations: this.violations.map((v) => ({
        category: v.category,
        suggestion: VIOLATION_SUGGESTIONS[v.category],
      })),
      reportId: this.reportId,
      canAppeal: this.canAppeal,
    };
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    if (this.violations.length === 0) {
      return 'Your content was blocked due to a policy violation. Please review our community guidelines.';
    }

    const categories = this.violations.map((v) => v.category).slice(0, 3);
    const categoryText = this.formatCategories(categories);

    return `Your content was blocked because it may contain ${categoryText}. Please modify your content and try again.`;
  }

  /**
   * Format violation categories into readable text
   */
  private formatCategories(categories: ViolationCategory[]): string {
    if (categories.length === 1) {
      return this.formatCategory(categories[0]);
    }
    if (categories.length === 2) {
      return `${this.formatCategory(categories[0])} or ${this.formatCategory(categories[1])}`;
    }
    const last = categories.pop()!;
    return `${categories.map(this.formatCategory).join(', ')}, or ${this.formatCategory(last)}`;
  }

  /**
   * Format a single category into readable text
   */
  private formatCategory(category: ViolationCategory): string {
    const categoryLabels: Record<ViolationCategory, string> = {
      hate: 'hateful content',
      harassment: 'harassment',
      violence: 'violent content',
      sexual: 'sexual content',
      'self-harm': 'harmful content',
      spam: 'spam',
      misinformation: 'misinformation',
    };
    return categoryLabels[category];
  }
}

/**
 * Error thrown when user is muted
 */
export class UserMutedError extends Error {
  public readonly muteExpiresAt: Date;

  constructor(muteExpiresAt: Date) {
    super('Your account is temporarily muted due to repeated policy violations');
    this.name = 'UserMutedError';
    this.muteExpiresAt = muteExpiresAt;
  }

  /**
   * Get remaining mute time in minutes
   */
  getRemainingMinutes(): number {
    const now = Date.now();
    const remaining = this.muteExpiresAt.getTime() - now;
    return Math.max(0, Math.ceil(remaining / 60000));
  }

  /**
   * Get user-friendly message with time remaining
   */
  getUserMessage(): string {
    const minutes = this.getRemainingMinutes();
    if (minutes < 60) {
      return `Your account is temporarily muted. You can post again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }
    const hours = Math.ceil(minutes / 60);
    return `Your account is temporarily muted. You can post again in ${hours} hour${hours === 1 ? '' : 's'}.`;
  }
}
