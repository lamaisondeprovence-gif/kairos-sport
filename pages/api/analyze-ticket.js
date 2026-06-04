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

Retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec cette structure exacte :
{
  "stake": 50,
  "matches": [
    {
      "home": "Arsenal",
      "away": "Chelsea",
      "sport": "Football",
      "competition": "Premier League",
      "pick": "1",
      "odd": 1.42
    }
  ],
  "totalOdd": 6.96,
  "potentialGain": 348
}

RÈGLES IMPORTANTES :
- stake = la mise en euros (nombre, pas de symbole €)
- odd = la cote pour chaque match (nombre décimal)
- totalOdd = multiplication de toutes les cotes
- potentialGain = stake × totalOdd
- Si une valeur est manquante, mets null
- Ne génère QUE du JSON pur, aucun texte avant ou après`;

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
    const raw = result.response.text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Essayer d'extraire le JSON si du texte parasite est présent
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return res.status(422).json({ success: false, error: 'Impossible de lire le ticket. Essaie un texte plus clair avec les cotes.' });
        }
      } else {
        return res.status(422).json({ success: false, error: 'Impossible de lire le ticket. Essaie un texte plus clair avec les cotes.' });
      }
    }

    // Vérifier et corriger les valeurs
    const stake = parseFloat(parsed.stake) || 0;
    const matches = parsed.matches || [];

    // Recalculer la cote totale depuis les cotes individuelles
    const validMatches = matches.filter(m => m.odd && parseFloat(m.odd) > 1);
    const totalOdd = validMatches.length > 0
      ? validMatches.reduce((acc, m) => acc * parseFloat(m.odd), 1)
      : parseFloat(parsed.totalOdd) || 1;

    // Recalculer le gain potentiel
    const potentialGain = stake > 0 ? stake * totalOdd : 0;
    const profit = potentialGain - stake;

    // Calculer le Kairos Score pour chaque match
    const analyzedMatches = matches.map(match => {
      const odd = parseFloat(match.odd) || 2.0;
      const scoreData = calculateKairosScore({
        formHome: 50,
        formAway: 50,
        dataCompleteness: 65,
        oddHome: odd,
        weatherOk: true,
      });

      return {
        ...match,
        odd: parseFloat(match.odd) || null,
        kairosScore: scoreData.score,
        confidence: scoreData.confidence,
        riskLevel: scoreData.riskLevel,
        recommendation: scoreData.recommendation,
        breakdown: scoreData.breakdown,
        trapData: scoreData.trapData,
      };
    });

    // Score global
    const globalScore = analyzedMatches.length > 0
      ? Math.round(analyzedMatches.reduce((a, m) => a + m.kairosScore, 0) / analyzedMatches.length)
      : 0;

    // Match le plus risqué
    const worstMatch = analyzedMatches.length > 0
      ? analyzedMatches.reduce((min, m) => m.kairosScore < min.kairosScore ? m : min, analyzedMatches[0])
      : null;

    // Optimisation : suggère de retirer les matchs avec score < 75
    const risky = analyzedMatches.filter(m => m.kairosScore < 75);
    let optimization = null;
    if (risky.length > 0 && analyzedMatches.length > 1) {
      const optimized = analyzedMatches.filter(m => m.kairosScore >= 75);
      if (optimized.length > 0) {
        const newOdd = optimized.reduce((acc, m) => acc * (parseFloat(m.odd) || 1.5), 1);
        const newGain = stake > 0 ? (stake * newOdd).toFixed(0) : 0;
        const newScore = Math.round(optimized.reduce((a, m) => a + m.kairosScore, 0) / optimized.length);
        optimization = {
          remove: risky.map(m => `${m.home} vs ${m.away}`),
          newMatchCount: optimized.length,
          newOdd: newOdd.toFixed(2),
          newGain,
          newScore,
          improvement: newScore - globalScore,
        };
      }
    }

    const analysis = {
      stake,
      totalOdd: parseFloat(totalOdd.toFixed(2)),
      potentialGain: parseFloat(potentialGain.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      matchCount: analyzedMatches.length,
      matches: analyzedMatches,
      globalScore,
      globalRisk: globalScore >= 85 ? 'Faible' : globalScore >= 75 ? 'Moyen' : 'Élevé',
      worstMatch: worstMatch ? `${worstMatch.home} vs ${worstMatch.away}` : null,
      optimization,
      recommendation: globalScore >= 80 ? 'ticket viable' : 'optimisation recommandée',
    };

    // Sauvegarder dans Supabase
    try {
      await supabase.from('ks_imported_tickets').insert({
        raw_input: text || '[image]',
        parsed_json: parsed,
        analysis_json: analysis,
      });
    } catch {}

    return res.status(200).json({ success: true, analysis });

  } catch (err) {
    console.error('Analyze ticket error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
