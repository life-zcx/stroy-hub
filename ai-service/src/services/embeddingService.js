/**
 * Lightweight N-Gram Vector Embedding Engine for Construction Materials Semantic Matching.
 * Provides O(N) cosine similarity matching between estimate queries and catalog products.
 */

/**
 * Generate a sparse term & character n-gram frequency vector from raw text.
 */
export function generateTextVector(text) {
  if (!text || typeof text !== 'string') return new Map();
  const normalized = text.toLowerCase().replace(/[^a-zа-яё0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = normalized.split(' ').filter(w => w.length >= 2);
  const vector = new Map();

  for (const word of words) {
    // Word frequency (weighted heavily)
    vector.set(word, (vector.get(word) || 0) + 2.0);

    // 3-gram character sub-tokens for typo & morphology tolerance
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = word.substring(i, i + 3);
        vector.set(`gram:${trigram}`, (vector.get(`gram:${trigram}`) || 0) + 0.5);
      }
    }
  }

  return vector;
}

/**
 * Compute Cosine Similarity between two sparse term vectors (0.0 to 1.0).
 */
export function computeCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.size === 0 || vectorB.size === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const val of vectorA.values()) {
    normA += val * val;
  }
  for (const val of vectorB.values()) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [key, valA] of vectorA.entries()) {
    if (vectorB.has(key)) {
      dotProduct += valA * vectorB.get(key);
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ranks products by semantic vector similarity against a raw query string.
 */
export function rankProductsByVectorSimilarity(query, products = [], limit = 20) {
  const queryVec = generateTextVector(query);
  if (queryVec.size === 0 || !Array.isArray(products) || products.length === 0) {
    return products.slice(0, limit);
  }

  const scored = products.map(p => {
    const textToEmbed = `${p.name || ''} ${p.category || ''} ${p.article || ''} ${p.specifications || ''}`;
    const pVec = generateTextVector(textToEmbed);
    const similarity = computeCosineSimilarity(queryVec, pVec);
    return { product: p, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit).map(s => s.product);
}
