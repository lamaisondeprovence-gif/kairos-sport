import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function quickScore(odd) {
  const p = 1 / odd;
  if (p > 0.7) return 75;
  if (p > 0.5) return 65;
  if (p > 0.35) return 55;
  return 45;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, imageBase64, imageType } = req.body;
  if (!text && !imageBase64) return res.status(400).json({ success: false, error: 'Fournir text ou image' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `Analyse ce ticket de pari. Retourne UNIQUEMENT du JSON pur sans markdown:
{"stake":20,"matches":[{"home":"Belgique","away":"Tunisie","sport":"Football","competition":"Amical","odd":2.0}],"totalOdd":2.0,"potentialGain":40}
Règles: stake=mise en euros, odd=cote décimale, totalOdd=produit des cotes, potentialGain=stake×totalOdd. JSON pur uniquement.`;

    let result;
    if (imageBase64) {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: imageType || 'image/jpeg', data: imageBase64 } }] }]
      });
    } else {
      result = await model.generateContent(`${prompt}\n\nTicket:\n${text}`);
    }

    let raw = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = null; } }
    }

    // Fallback si Gemini échoue — parser manuellement le texte
    if (!parsed && text) {
      const lines = text.split('\n').filter(l => l.trim());
      const matches = [];
      let stake = 20;
      
      for (const line of lines) {
        const miseMatch = line.match(/mise\s*:?\s*(\d+)/i);
        if (miseMatch) { stake = parseFloat(miseMatch[1]); continue; }
        
        const oddMatch = line.match(/@(\d+\.?\d*)/);
        const vsMatch = line.match(/(.+?)\s+vs\s+(.+?)(?:\s+@|$)/i);
        
        if (vsMatch && oddMatch) {
          matches.push({
            home: vsMatch[1].trim(),
            away: vsMatch[2].trim(),
            sport: 'Football',
            competition: 'Match',
            odd: parseFloat(oddMatch[1]),
          });
        }
      }
      
      if (matches.length > 0) {
        const totalOdd = matches.reduce((a, m) => a * m.odd, 1);
        parsed = { stake, matches, totalOdd, potentialGain: stake * totalOdd };
      }
    }

    if (!parsed) {
      return res.status(422).json({ success: false, error: 'Format non reconnu. Exemple: Belgique vs Tunisie @2.00\nMise : 20€' });
    }

    const stake = parseFloat(parsed.stake) || 0;
    const matches = parsed.matches || [];
    const totalOdd = matches.length > 0 ? matches.reduce((a, m) => a * parseFloat(m.odd || 2), 1) : parseFloat(parsed.totalOdd) || 1;
    const potentialGain = stake > 0 ? stake * totalOdd : 0;

    const analyzedMatches = matches.map(m => {
      const odd = parseFloat(m.odd) || 2.0;
      const score = quickScore(odd);
      return { ...m, odd, kairosScore: score, kairosIndex: score * 10, riskLevel: score >= 75 ? 'Moyen' : 'Élevé', recommendation: score >= 75 ? 'parier' : 'surveiller' };
    });

    const globalScore = analyzedMatches.length > 0 ? Math.round(analyzedMatches.reduce((a, m) => a + m.kairosScore, 0) / analyzedMatches.length) : 50;

    return res.status(200).json({
      success: true,
      analysis: {
        stake, totalOdd: parseFloat(totalOdd.toFixed(2)),
        potentialGain: parseFloat(potentialGain.toFixed(2)),
        profit: parseFloat((potentialGain - stake).toFixed(2)),
        matchCount: analyzedMatches.length,
        matches: analyzedMatches,
        globalScore, globalIndex: globalScore * 10,
        globalRisk: globalScore >= 75 ? 'Moyen' : 'Élevé',
        recommendation: globalScore >= 75 ? 'ticket viable' : 'optimisation recommandée',
      },
    });

  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ success: false, error: 'Erreur: ' + err.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };
