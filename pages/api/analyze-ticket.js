import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateKairosScore } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, imageBase64, imageType } = req.body;

  if (!text && !imageBase64) {
    return res.status(400).json({ success: false, error: 'Fournir text ou imageBase64' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const extractionPrompt = `Tu es un expert en paris sportifs. Analyse ce ticket de pari et extrait les informations.
    
Retourne UNIQUEMENT un JSON valide (sans markdown) avec cette structure exacte :
{
  "stake": 50,
  "matches": [
    {
      "home": "Équipe A",
      "away": "Équipe B",
      "sport": "Football",
      "competition": "Ligue 1",
      "pick": "1",
      "odd": 1.85
    }
  ],
  "totalOdd": 3.40,
  "potentialGain": 170
}

Si une valeur est manquante, mets null. Ne génère que du JSON pur.`;

    let parts;
    if (imageBase64) {
      parts = [
        { text: extractionPrompt },
        { inlineData: { mimeType: imageType || 'image/jpeg', data: imageBase64 } },
      ];
    } else {
      parts = [{ text: `${extractionPrompt}\n\nTicket à analyser :\n${text}` }];
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const raw = result.response.text().replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(422).json({ success: false, error: 'Impossible de lire le ticket. Essaie un texte plus clair.' });
    }

    const analyzedMatches = parsed.matches.map(match => {
      const scoreData = calculateKairosScore({
        formHome: 50,
        formAway: 50,
        dataCompleteness: 70,
        oddHome: match.odd || 2.0,
      });
      return {
        ...match,
        kairosScore: scoreData.score,
        confidence: scoreData.confidence,
        riskLevel: scoreData.riskLevel,
        recommendation: scoreData.recommendation,
        breakdown: scoreData.breakdown,
      };
    });

    const globalScore = Math.round(
      analyzedMatches.reduce((a, m) => a + m.kairosScore, 0) / analyzedMatches.length
    );
    const worstMatch = analyzedMatches.reduce(
      (min, m) => (m.kairosScore < min.kairosScore ? m : min),
      analyzedMatches[0]
    );

    const risky = analyzedMatches.filter(m => m.kairosScore < 75);
    let optimization = null;
    if (risky.length > 0 && analyzedMatches.length > 1) {
      const optimized = analyzedMatches.filter(m => m.kairosScore >= 75);
      const newOdd = optimized.reduce((acc, m) => acc * (m.odd || 1.5), 1).toFixed(2);
      const newGain = optimized.length > 0 ? ((parsed.stake || 50) * newOdd).toFixed(0) : 0;
      const newScore = optimized.length > 0
        ? Math.round(optimized.reduce((a, m) => a + m.kairosScore, 0) / optimized.length)
        : 0;
      optimization = {
        remove: risky.map(m => `${m.home} vs ${m.away}`),
        newMatchCount: optimized.length,
        newOdd,
        newGain,
        newScore,
        improvement: newScore - globalScore,
      };
    }

    const analysis = {
      stake: parsed.stake,
      totalOdd: parsed.totalOdd,
      potentialGain: parsed.potentialGain || (parsed.stake * parsed.totalOdd),
      matchCount: analyzedMatches.length,
      matches: analyzedMatches,
      globalScore,
      globalRisk: globalScore >= 85 ? 'Faible' : globalScore >= 75 ? 'Moyen' : 'Élevé',
      worstMatch: worstMatch ? `${worstMatch.home} vs ${worstMatch.away}` : null,
      optimization,
      recommendation: globalScore >= 80 ? 'ticket viable' : 'optimisation recommandée',
    };

    await supabase.from('ks_imported_tickets').insert({
      raw_input: text || '[image]',
      parsed_json: parsed,
      analysis_json: analysis,
    });

    return res.status(200).json({ success: true, analysis });
  } catch (err) {
    console.error('Analyze ticket error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
