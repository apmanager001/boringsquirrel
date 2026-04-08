import type { GameEntry } from "@/lib/site";

export type PuzzlePlayMode = "classic" | "daily";

export const CLASSIC_SCORE_KEY = "classic";

const dailyScoreKeyPrefix = "daily:";
const dayKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

function readSingleValue(value?: string | string[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isValidDayKey(value: string) {
  if (!dayKeyPattern.test(value)) {
    return false;
  }

  return Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

export function getCurrentDailyPuzzleDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function normalizeDayKey(
  value?: string | string[] | null,
  fallback = getCurrentDailyPuzzleDayKey(),
) {
  const candidate = readSingleValue(value)?.trim() ?? "";

  return isValidDayKey(candidate) ? candidate : fallback;
}

export function parsePuzzlePlayMode(value?: string | string[] | null) {
  return readSingleValue(value) === "daily" ? "daily" : "classic";
}

export function createDailyScoreKey(dayKey: string) {
  return `${dailyScoreKeyPrefix}${normalizeDayKey(dayKey)}`;
}

export function normalizeScoreKey(scoreKey?: string | null) {
  const candidate = scoreKey?.trim().toLowerCase() ?? "";

  if (!candidate || candidate === CLASSIC_SCORE_KEY) {
    return CLASSIC_SCORE_KEY;
  }

  if (!candidate.startsWith(dailyScoreKeyPrefix)) {
    return null;
  }

  const dayKey = candidate.slice(dailyScoreKeyPrefix.length);

  return isValidDayKey(dayKey) ? createDailyScoreKey(dayKey) : null;
}

export function parseScoreKey(scoreKey?: string | null): {
  mode: PuzzlePlayMode;
  dayKey: string | null;
  scoreKey: string;
} {
  const normalizedScoreKey = normalizeScoreKey(scoreKey) ?? CLASSIC_SCORE_KEY;

  if (normalizedScoreKey === CLASSIC_SCORE_KEY) {
    return {
      mode: "classic",
      dayKey: null,
      scoreKey: CLASSIC_SCORE_KEY,
    };
  }

  return {
    mode: "daily",
    dayKey: normalizedScoreKey.slice(dailyScoreKeyPrefix.length),
    scoreKey: normalizedScoreKey,
  };
}

export function buildGamePlayHref(
  gameSlug: GameEntry["slug"],
  options?: {
    mode?: PuzzlePlayMode;
    dayKey?: string | null;
  },
) {
  if (options?.mode !== "daily") {
    return `/games/${gameSlug}`;
  }

  const dayKey = normalizeDayKey(options.dayKey ?? undefined);
  const searchParams = new URLSearchParams({
    mode: "daily",
    day: dayKey,
  });

  return `/games/${gameSlug}?${searchParams.toString()}`;
}

export function formatDailyPuzzleDate(dayKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${normalizeDayKey(dayKey)}T00:00:00.000Z`));
}

function xmur3(seed: string) {
  let hash = 1779033703 ^ seed.length;

  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return function nextSeed() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;

    return hash >>> 0;
  };
}

function mulberry32(seed: number) {
  return function nextRandom() {
    let value = (seed += 0x6d2b79f5);

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: string) {
  return mulberry32(xmur3(seed)());
}
