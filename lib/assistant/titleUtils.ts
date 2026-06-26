export const TITLE_MAX_LENGTH = 50;
export const TITLE_MAX_WORDS = 6;

export function limitWordCount(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ");
}

export function truncateToLastCompleteWord(
  text: string,
  maxLength: number,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  const prefix = text.slice(0, maxLength);

  if (text[maxLength] && /\s/.test(text[maxLength])) {
    return prefix.trimEnd();
  }

  const lastSpaceIndex = prefix.lastIndexOf(" ");

  if (lastSpaceIndex > 0) {
    return `${prefix.slice(0, lastSpaceIndex).trimEnd()}…`;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

export function titleFromUserMessage(
  text: string,
  maxLength = TITLE_MAX_LENGTH,
): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const wordLimited = limitWordCount(normalized, TITLE_MAX_WORDS);

  if (wordLimited.length <= maxLength) {
    return wordLimited;
  }

  return truncateToLastCompleteWord(wordLimited, maxLength);
}
