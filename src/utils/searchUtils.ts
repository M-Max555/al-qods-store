/**
 * Smart Search Utility for Al Quds Store
 * Supports: Arabic variations, Typos (Levenshtein), Synonyms, and Normalization
 */

const SYNONYMS: Record<string, string[]> = {
  "ثلاجة": ["تلاجة", "تلجه", "تلاجه", "fridge", "refrigerator", "cooling"],
  "غسالة": ["غساله", "washing machine", "washer"],
  "بوتاجاز": ["بوتاجاز", "بوتاجازات", "فرن", "stove", "oven", "cooker"],
  "خلاط": ["خلاط", "blender", "mixer"],
  "شاشة": ["شاشه", "تلفزيون", "tv", "television", "screen"],
  "تكييف": ["تكييف", "تكييفات", "ac", "air conditioner"],
  "مكواة": ["مكواه", "iron"],
  "ديب فريزر": ["ديب فريزر", "deep freezer"],
  "مروحة": ["مروحه", "fan"]
};

/**
 * Normalizes text for better matching
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, "")
    .replace(/[^\w\u0621-\u064A]/g, ""); // Remove non-alphanumeric/Arabic
}

/**
 * Levenshtein Distance for typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Main Smart Search Function
 */
export function smartMatch(query: string, target: string): boolean {
  const normQuery = normalizeText(query);
  const normTarget = normalizeText(target);

  if (normQuery.length < 2) return false;

  // 1. Direct match or includes
  if (normTarget.includes(normQuery) || normQuery.includes(normTarget)) return true;

  // 2. Synonyms check
  for (const [key, variants] of Object.entries(SYNONYMS)) {
    const normKey = normalizeText(key);
    const normVariants = variants.map(v => normalizeText(v));

    const isQuerySynonym = normQuery.includes(normKey) || normVariants.some(v => normQuery.includes(v));
    const isTargetSynonym = normTarget.includes(normKey) || normVariants.some(v => normTarget.includes(v));

    if (isQuerySynonym && isTargetSynonym) return true;
  }

  // 3. Typo tolerance (Levenshtein) - only for longer words
  if (normQuery.length > 3 && normTarget.length > 3) {
    const dist = levenshteinDistance(normQuery, normTarget);
    const threshold = Math.floor(normQuery.length * 0.3); // 30% error allowed
    if (dist <= threshold) return true;
  }

  return false;
}
