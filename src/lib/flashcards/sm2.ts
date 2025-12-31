/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm:
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Quality ratings:
 * 0 - Complete blackout, no recall at all
 * 1 - Incorrect, but recognized upon reveal
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct, but with serious difficulty
 * 4 - Correct, with some hesitation
 * 5 - Perfect response, instant recall
 */

export interface SM2Input {
  quality: number;      // 0-5: user's self-rating of recall quality
  easeFactor: number;   // Current ease factor (starts at 2.5)
  interval: number;     // Current interval in days
  repetitions: number;  // Number of successful reviews in a row
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate the next review parameters using SM-2 algorithm
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, easeFactor, interval, repetitions } = input;

  // Validate quality is between 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let newEF = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (q >= 3) {
    // Correct response - increase interval
    if (repetitions === 0) {
      newInterval = 1; // First successful review: 1 day
    } else if (repetitions === 1) {
      newInterval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by ease factor
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset to beginning
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Ease factor should never go below 1.3
  if (newEF < 1.3) {
    newEF = 1.3;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEF * 100) / 100, // Round to 2 decimal places
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * Get cards that are due for review (nextReviewDate <= now)
 */
export function getCardsForReview<T extends { id: string; nextReviewDate: Date }>(
  cards: T[],
  limit: number = 20
): T[] {
  const now = new Date();

  return cards
    .filter((card) => new Date(card.nextReviewDate) <= now)
    .sort((a, b) =>
      new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
    )
    .slice(0, limit);
}

/**
 * Get cards that are new (never reviewed)
 */
export function getNewCards<T extends { id: string; repetitions: number }>(
  cards: T[],
  limit: number = 10
): T[] {
  return cards
    .filter((card) => card.repetitions === 0)
    .slice(0, limit);
}

/**
 * Calculate study statistics for a deck
 */
export function calculateDeckStats(
  cards: Array<{
    nextReviewDate: Date;
    repetitions: number;
    easeFactor: number;
  }>
): {
  total: number;
  new: number;
  learning: number;
  review: number;
  due: number;
  averageEaseFactor: number;
} {
  const now = new Date();

  const stats = {
    total: cards.length,
    new: 0,
    learning: 0,
    review: 0,
    due: 0,
    averageEaseFactor: 0,
  };

  if (cards.length === 0) return stats;

  let totalEF = 0;

  for (const card of cards) {
    totalEF += card.easeFactor;

    if (card.repetitions === 0) {
      stats.new++;
    } else if (card.repetitions < 3) {
      stats.learning++;
    } else {
      stats.review++;
    }

    if (new Date(card.nextReviewDate) <= now) {
      stats.due++;
    }
  }

  stats.averageEaseFactor = Math.round((totalEF / cards.length) * 100) / 100;

  return stats;
}

/**
 * Estimate time to complete study session
 * Assumes ~10 seconds per card on average
 */
export function estimateStudyTime(cardCount: number): string {
  const seconds = cardCount * 10;

  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `${hours}h`;
  }
}

/**
 * Get quality rating label
 */
export function getQualityLabel(quality: number): string {
  const labels = [
    "Blackout",      // 0
    "Wrong",         // 1
    "Hard",          // 2
    "Good",          // 3
    "Easy",          // 4
    "Perfect",       // 5
  ];
  return labels[quality] || "Unknown";
}

/**
 * Get quality rating color (for UI)
 */
export function getQualityColor(quality: number): string {
  const colors = [
    "#ef4444", // 0 - red
    "#f97316", // 1 - orange
    "#eab308", // 2 - yellow
    "#22c55e", // 3 - green
    "#3b82f6", // 4 - blue
    "#8b5cf6", // 5 - purple
  ];
  return colors[quality] || "#6b7280";
}
