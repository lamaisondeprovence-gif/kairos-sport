const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function calculateQuickScore(odd) {
  const prob = 1 / odd;
  if (prob > 0.7) return 75;
  if (prob > 0.5) return 65;
  if (prob > 0.35) return 55;
  return 45;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, imageBase64, imageType } = req.body;

  if (!text && !imageBase64) {
    return res.status(400).json({ success: false, error: 'Fournir text ou image' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `Analyse ce ticket de pari sportif et extrait les informations.
Retourne UNIQUEMENT du JSON pur sans markdown ni backticks :
{
  "stake": 50,
  "matches": [
    {"home": "Equipe1", "away": "Equipe2", "sport": "Football", "competition": "Liga", "odd": 1.85}
  ],
  "totalOdd": 1.85,
  "potentialGain": 92.5
}
Règles : stake en euros (nombre), odd en décimal, totalOdd = produit des cotes, potentialGain = stake × totalOdd. JSON pur uniquement.`;

    let result;
    if (imageBase64) {
      result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: imageType || 'image/jpeg', data: imageBase64 } }
          ]
        }]
      });
    } else {
      result = await model.generateContent(`${prompt}\n\nTicket:\n${text}`);
    }

    const raw = result.response.text()
      .replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { return res.status(422).json({ success: false, error: 'Impossible de lire le ticket. Ajoute les cotes comme @1.85' }); }
      } else {
        return res.status(422).json({ success: false, error: 'Format non reconnu. Exemple : Belgique vs Tunisie @2.00' });
      }
    }

    const stake = parseFloat(parsed.stake) || 0;
    const matches = parsed.matches || [];

    // Recalculer cotes et gains
    const validMatches = matches.filter(m => m.odd && parseFloat(m.odd) > 1);
    const totalOdd = validMatches.length > 0
      ? validMatches.reduce((acc, m) => acc * parseFloat(m.odd), 1)
      : parseFloat(parsed.totalOdd) || 1;
    const potentialGain = stake > 0 ? stake * totalOdd : 0;

    // Analyse KAIROS pour chaque match
    const analyzedMatches = matches.map(m => {
      const odd = parseFloat(m.odd) || 2.0;
      const score = calculateQuickScore(odd);
      const kairosIndex = score * 10;
      return {
        ...m,
        odd: parseFloat(m.odd) || null,
        kairosScore: score,
        kairosIndex,
        riskLevel: score >= 85 ? 'Faible' : score >= 75 ? 'Moyen' : 'Élevé',
        recommendation: score >= 75 ? 'parier' : 'surveiller',
      };
    });

    const globalScore = analyzedMatches.length > 0
      ? Math.round(analyzedMatches.reduce((a, m) => a + m.kairosScore, 0) / analyzedMatches.length)
      : 50;
    const globalIndex = globalScore * 10;

    // Suggestion d'optimisation
    const risky = analyzedMatches.filter(m => m.kairosScore < 65);
    let optimization = null;
    if (risky.length > 0 && analyzedMatches.length > 1) {
      const optimized = analyzedMatches.filter(m => m.kairosScore >= 65);
      if (optimized.length > 0) {
        const newOdd = optimized.reduce((acc, m) => acc * (parseFloat(m.odd) || 1.5), 1);
        optimization = {
          remove: risky.map(m => `${m.home} vs ${m.away}`),
          newMatchCount: optimized.length,
          newOdd: newOdd.toFixed(2),
          newGain: stake > 0 ? (stake * newOdd).toFixed(0) : 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      analysis: {
        stake,
        totalOdd: parseFloat(totalOdd.toFixed(2)),
        potentialGain: parseFloat(potentialGain.toFixed(2)),
        profit: parseFloat((potentialGain - stake).toFixed(2)),
        matchCount: analyzedMatches.length,
        matches: analyzedMatches,
        globalScore,
        globalIndex,
        globalRisk: globalScore >= 85 ? 'Faible' : globalScore >= 75 ? 'Moyen' : 'Élevé',
        recommendation: globalScore >= 75 ? 'ticket viable' : 'optimisation recommandée',
        optimization,
      },
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ success: false, error: 'Erreur analyse : ' + err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
