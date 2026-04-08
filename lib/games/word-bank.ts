import {
  CURATED_WORD_BANK,
  CURATED_WORDLE_ANSWER_BANK,
} from "@/lib/games/word-bank-data";

const vowels = new Set(["a", "e", "i", "o", "u"]);

export const WORD_BANK = [...CURATED_WORD_BANK];
export const WORDLE_ANSWER_BANK = [...CURATED_WORDLE_ANSWER_BANK];
export const WORD_BANK_SET = new Set(WORD_BANK);

function countVowels(word: string) {
  return Array.from(word).filter((character) => vowels.has(character)).length;
}

function hasMostlyUniqueLetters(word: string) {
  return new Set(word).size >= 4;
}

function isGeneralPlayableWord(word: string) {
  return (
    word[word.length - 1] !== "s" &&
    countVowels(word) >= 1 &&
    hasMostlyUniqueLetters(word)
  );
}

export function isWordInBank(word: string) {
  return WORD_BANK_SET.has(word.trim().toLowerCase());
}

export function pickRandomWord(
  words = WORD_BANK,
  randomSource: () => number = Math.random,
) {
  return (
    words[Math.floor(randomSource() * words.length)] ??
    WORDLE_ANSWER_BANK[0] ??
    WORD_BANK[0] ??
    "aback"
  );
}

export function shuffleWords<T>(
  items: readonly T[],
  randomSource: () => number = Math.random,
) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomSource() * (index + 1));
    const currentItem = nextItems[index];

    nextItems[index] = nextItems[swapIndex] as T;
    nextItems[swapIndex] = currentItem as T;
  }

  return nextItems;
}

export const WAFFLE_WORD_BANK = WORD_BANK.filter(isGeneralPlayableWord);
export const WORD_SEARCH_WORD_BANK = WORD_BANK.filter(isGeneralPlayableWord);
