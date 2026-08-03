// Supported and prioritized Gemini models list
export const getCandidateModels = () => {
  const candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite-001'
  ]
    .filter(Boolean)
    .map(m => m.trim().replace(/^models\//, ''));

  return [...new Set(candidateModels)];
};
