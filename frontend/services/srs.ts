import type { CardDoc } from './types';

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_DELTA = 0.1;
const AGAIN_INTERVAL_DAYS = 0; // same day / minutes
const MIN_INTERVAL_DAYS = 0.04; // ~1 hour

/** Quality: Again = 0, Hard = 1, Good = 2, Easy = 3 (simplified from SM-2 0-5) */
export type Quality = 0 | 1 | 2 | 3;

export function scheduleCard(doc: CardDoc, quality: Quality): CardDoc {
  const now = new Date();
  const nextReview = new Date(now);
  const lastReview = now.toISOString();
  const interval = doc.interval ?? 0;
  const ease = doc.ease_factor ?? INITIAL_EASE;
  const reps = (doc.repetitions ?? 0) + 1;

  let nextIntervalDays: number;
  let nextEase = ease;

  if (quality === 0) {
    // Again: reset or very short interval
    nextIntervalDays = AGAIN_INTERVAL_DAYS;
    nextEase = Math.max(MIN_EASE, ease - EASE_DELTA);
  } else if (quality === 1) {
    nextIntervalDays = Math.max(MIN_INTERVAL_DAYS, interval * 0.8);
    nextEase = Math.max(MIN_EASE, ease - 0.05);
  } else if (quality === 2) {
    // Good
    nextIntervalDays =
      interval < 1
        ? 1
        : Math.max(MIN_INTERVAL_DAYS, interval * ease);
    nextEase = ease;
  } else {
    // Easy
    nextIntervalDays = Math.max(
      MIN_INTERVAL_DAYS,
      (interval || 1) * ease * 1.3
    );
    nextEase = Math.min(2.5, ease + 0.15);
  }

  nextReview.setDate(nextReview.getDate() + nextIntervalDays);
  const nextReviewIso = nextReview.toISOString();

  return {
    ...doc,
    next_review: nextReviewIso,
    last_review: lastReview,
    interval: nextIntervalDays,
    ease_factor: nextEase,
    repetitions: reps,
  };
}
