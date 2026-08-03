import { getCandidateModels } from '../config/models.js';

export async function generateContentWithFallback({ systemInstruction, contents, apiKey }) {
  const models = getCandidateModels();
  let replyText = '';

  for (const modelCandidate of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${apiKey}`;
      console.log(`[AI SERVICE] Trying Gemini model: "${modelCandidate}"...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          replyText = candidateText.trim();
          console.log(`[AI SERVICE SUCCESS] Gemini Model "${modelCandidate}" succeeded!`);
          break;
        }
      } else {
        const errBody = await response.text();
        console.warn(`[GEMINI RETRY] Model "${modelCandidate}" HTTP ${response.status}: ${errBody.substring(0, 150)}`);
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (err) {
      console.warn(`[GEMINI RETRY] Model "${modelCandidate}" error: ${err.message}`);
      await new Promise(r => setTimeout(r, 600));
    }
  }

  return replyText;
}
