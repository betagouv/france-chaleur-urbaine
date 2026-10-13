/** A run of text of one side of a comparison. */
export type DiffSegment = {
  text: string;
  /** `different`: no counterpart on the other side; `variant`: same word, other case or accents; `same`: identical */
  kind: 'same' | 'variant' | 'different';
};

const fold = (token: string) =>
  token
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
/** Words, numbers, spaces and punctuation (all kept, so the text can be rebuilt). */
const tokenize = (value: string) => value.match(/\p{L}+|\p{N}+|\s+|[^\p{L}\p{N}\s]+/gu) ?? [];
const isWord = (token: string) => /[\p{L}\p{N}]/u.test(token);
// a matched word is worth far more than a matched separator: the alignment follows the words, never the spaces
const weightOf = (token: string) => (isWord(token) ? 1000 : 1);

/**
 * Word-level comparison of two short values (a network name, a gestionnaire…), aligned regardless of case and accents:
 * a word without counterpart on the other side is `different`, a word that only changed case or accents `variant`.
 * Heaviest common subsequence on the folded words: the values are short, the quadratic table is fine.
 */
export const diffValues = (left: string, right: string): { left: DiffSegment[]; right: DiffSegment[] } => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const leftFolded = leftTokens.map(fold);
  const rightFolded = rightTokens.map(fold);
  // best[leftIndex][rightIndex] = weight of the best common subsequence of the remaining tokens
  const best: number[][] = Array.from({ length: leftTokens.length + 1 }, () => new Array<number>(rightTokens.length + 1).fill(0));
  for (let leftIndex = leftTokens.length - 1; leftIndex >= 0; leftIndex--) {
    for (let rightIndex = rightTokens.length - 1; rightIndex >= 0; rightIndex--) {
      best[leftIndex][rightIndex] =
        leftFolded[leftIndex] === rightFolded[rightIndex]
          ? best[leftIndex + 1][rightIndex + 1] + weightOf(leftTokens[leftIndex])
          : Math.max(best[leftIndex + 1][rightIndex], best[leftIndex][rightIndex + 1]);
    }
  }
  const leftSegments: DiffSegment[] = [];
  const rightSegments: DiffSegment[] = [];
  const push = (segments: DiffSegment[], text: string, kind: DiffSegment['kind']) => {
    const last = segments.at(-1);
    if (last && last.kind === kind) {
      last.text += text;
    } else {
      segments.push({ kind, text });
    }
  };
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < leftTokens.length || rightIndex < rightTokens.length) {
    const bothLeft = leftIndex < leftTokens.length && rightIndex < rightTokens.length;
    if (bothLeft && leftFolded[leftIndex] === rightFolded[rightIndex]) {
      const kind = leftTokens[leftIndex] === rightTokens[rightIndex] ? 'same' : 'variant';
      push(leftSegments, leftTokens[leftIndex], kind);
      push(rightSegments, rightTokens[rightIndex], kind);
      leftIndex++;
      rightIndex++;
    } else if (
      rightIndex < rightTokens.length &&
      (leftIndex >= leftTokens.length || best[leftIndex][rightIndex + 1] >= best[leftIndex + 1][rightIndex])
    ) {
      push(rightSegments, rightTokens[rightIndex], 'different');
      rightIndex++;
    } else {
      push(leftSegments, leftTokens[leftIndex], 'different');
      leftIndex++;
    }
  }
  return { left: leftSegments, right: rightSegments };
};
