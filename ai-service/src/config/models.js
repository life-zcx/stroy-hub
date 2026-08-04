// Supported and prioritized Gemini models list
export const getCandidateModels = () => {
  const envModel = process.env.GEMINI_MODEL?.trim()?.replace(/^models\//, '');

  const candidateModels = [
    'gemini-3.6-flash',        // Основная сбалансированная модель
    'gemini-3.5-flash-lite',   // Быстрый и экономный фолбэк
    'gemini-3.1-flash-lite',   // Надежный запасной вариант
    'gemini-flash-latest',
    envModel
  ]
    .filter(Boolean)
    .map(m => m.trim().replace(/^models\//, ''));

  return [...new Set(candidateModels)];
};
