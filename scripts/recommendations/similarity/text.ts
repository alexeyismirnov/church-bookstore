import type { ExtractedProduct } from '../types';

/**
 * English stop words set (~150 common words).
 */
const STOP_WORDS: Set<string> = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
  'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when',
  'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'also',
  'about', 'up', 'there', 'here', 'many', 'much', 'well', 'us',
  // Additional common stop words
  'am', 'while', 'until', 'since', 'down', 'now', 'get', 'got', 'go',
  'going', 'gone', 'went', 'come', 'came', 'coming', 'make', 'made',
  'making', 'take', 'took', 'taken', 'see', 'saw', 'seen', 'know',
  'knew', 'known', 'think', 'thought', 'say', 'said', 'tell', 'told',
  'give', 'gave', 'given', 'use', 'used', 'find', 'found', 'want',
  'let', 'put', 'set', 'keep', 'kept', 'begin', 'began', 'seem',
  'help', 'show', 'showed', 'shown', 'hear', 'heard', 'play', 'run',
  'move', 'live', 'living', 'believe', 'its', 'been', 'being', 'having',
  'doing', 'would', 'could', 'should', 'shall', 'might', 'must', 'need',
  'dare', 'ought', 'used', 'one', 'two', 'three', 'four', 'five',
  'first', 'second', 'third', 'new', 'old', 'big', 'small', 'long',
  'short', 'high', 'low', 'young', 'large', 'little', 'good', 'great',
  'right', 'still', 'back', 'even', 'way', 'thing', 'man', 'men', 'day',
  'time', 'year', 'years', 'people', 'world', 'life', 'hand', 'part',
  'place', 'case', 'week', 'company', 'system', 'program', 'work',
]);

/**
 * Tokenize a description: lowercase, remove punctuation (keep only letters and spaces),
 * split on whitespace, remove stop words and tokens shorter than 2 characters.
 */
function tokenize(text: string): string[] {
  const lowercased = text.toLowerCase();
  // Keep only letters and spaces
  const lettersOnly = lowercased.replace(/[^a-z\s]/g, ' ');
  // Split on whitespace
  const rawTokens = lettersOnly.split(/\s+/);
  // Filter: remove stop words and short tokens
  return rawTokens.filter(
    (token) => token.length >= 2 && !STOP_WORDS.has(token)
  );
}

/**
 * Compute term frequency for a list of tokens.
 * Returns a Map of term → TF value (count / total tokens).
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length;

  if (total === 0) {
    return tf;
  }

  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }

  // Normalize by total token count
  for (const [term, count] of tf) {
    tf.set(term, count / total);
  }

  return tf;
}

/**
 * Compute IDF (inverse document frequency) for each term across all documents.
 * IDF(t) = log(N / df(t)) where N = total documents, df(t) = documents containing term t.
 */
function computeIDF(
  documentTokens: string[][],
  vocabulary: Set<string>
): Map<string, number> {
  const N = documentTokens.length;
  const idf = new Map<string, number>();

  // Count document frequency for each term
  const df = new Map<string, number>();
  for (const tokens of documentTokens) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Compute IDF
  for (const term of vocabulary) {
    const docFreq = df.get(term) ?? 0;
    if (docFreq === 0) {
      idf.set(term, 0);
    } else {
      idf.set(term, Math.log(N / docFreq));
    }
  }

  return idf;
}

/**
 * Compute TF-IDF vector for a document given its TF and the IDF map.
 */
function computeTFIDF(
  tf: Map<string, number>,
  idf: Map<string, number>
): Map<string, number> {
  const tfidf = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) ?? 0;
    tfidf.set(term, tfVal * idfVal);
  }
  return tfidf;
}

/**
 * Compute cosine similarity between two sparse vectors represented as Maps.
 *
 * cos(A, B) = (A · B) / (||A|| × ||B||)
 * Returns 0 if either vector has zero magnitude.
 */
export function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  // Dot product: iterate over the smaller vector for efficiency
  const [smaller, larger] =
    vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];

  let dotProduct = 0;
  for (const [term, valA] of smaller) {
    const valB = larger.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  if (dotProduct === 0) {
    return 0;
  }

  // Magnitudes
  let magA = 0;
  for (const val of vecA.values()) {
    magA += val * val;
  }
  magA = Math.sqrt(magA);

  let magB = 0;
  for (const val of vecB.values()) {
    magB += val * val;
  }
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dotProduct / (magA * magB);
}

/**
 * Compute the full text similarity matrix for all products using TF-IDF cosine similarity.
 *
 * Returns a Map<productId, Map<productId, similarityScore>>.
 */
export function computeTextSimilarityMatrix(
  products: ExtractedProduct[]
): Map<number, Map<number, number>> {
  const N = products.length;

  // Step 1: Tokenize all documents
  const allTokens: string[][] = products.map((p) => tokenize(p.description));

  // Step 2: Build vocabulary
  const vocabulary = new Set<string>();
  for (const tokens of allTokens) {
    for (const token of tokens) {
      vocabulary.add(token);
    }
  }

  // Step 3: Compute IDF across all documents
  const idf = computeIDF(allTokens, vocabulary);

  // Step 4: Compute TF-IDF vectors for each document
  const tfidfVectors: Map<string, number>[] = allTokens.map((tokens) => {
    const tf = computeTF(tokens);
    return computeTFIDF(tf, idf);
  });

  // Step 5: Compute pairwise cosine similarity
  const matrix = new Map<number, Map<number, number>>();

  for (let i = 0; i < N; i++) {
    const innerMap = new Map<number, number>();
    for (let j = 0; j < N; j++) {
      if (i === j) {
        innerMap.set(products[j].id, 1.0); // Self-similarity
      } else {
        const sim = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        innerMap.set(products[j].id, sim);
      }
    }
    matrix.set(products[i].id, innerMap);
  }

  return matrix;
}
