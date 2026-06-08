// /api/horses-tri-ia.js
// KAIROS SPORT — Système 3 IA en parallèle
// KAIROS ALGO + GEMINI 2.5 + OPENAI GPT-4o → CONSENSUS ENGINE

// ── ALGO KAIROS (copie exacte depuis analyzer) ──────────────────
function analyzeMusique(musique) {
  if (!musique) return { nb: 0, v: 0, p: 0, reg: 0, tendance: 'inconnu', serie: 0 };
  const chars = musique.replace(/[^1-9p]/g, '').split('');
  let nb = 0, v = 0, p = 0;
  for (const ch of chars) {
    if (/[1-9]/.test(ch)) { nb++; if (ch === '1') v++; if (['2','3'].includes(ch)) p++; }
    if (ch === 'p') p++;
  }
  const reg = nb > 0 ? Math.round((v + p) / nb * 100) : 0;
  const recent = chars.filter(c => /[1-9]/.test(c)).slice(-3);
  const avg = recent.reduce((a, c) => a + parseInt(c), 0) / Math.max(recent.length, 1);
  const tendance = avg <= 2 ? 'excellent' : avg <= 4 ? 'bon' : 'moyen';
  let serie = 0;
  const all = chars.filter(c => /[1-9]/.test(c));
  for (let i = all.length - 1; i >= 0; i--) { if (['1','2','3'].includes(all[i])) serie++; else break; }
  return { nb, v, p, reg, tendance, serie };
}

function getJockeyScore(j) {
  if (!j) return 10;
  const u = j.toUpperCase();
  if (u.includes('DEMURO') || u.includes('SOUMILLON')) return 100;
  if (u.includes('GUYON') || u.includes('POUCHIN')) return 90;
  if (u.includes('BARZALONA') || u.includes('LEMAIRE')) return 85;
  if (u.includes('PESLIER') || u.includes('PASQUIER')) return 80;
  if (u.includes('DETTORI') || u.includes('MOORE')) return 95;
  if (u.includes('GRANDIN') || u.includes('BACHELOT')) return 60;
  return 40;
}

function getTrainerScore(t) {
  if (!t) return 10;
  const u = t.toUpperCase();
  if (u.includes('FABRE') || u.includes('ROUGET')) return 100;
  if (u.includes('LELLOUCHE') || u.includes('CHAPPET') || u.includes('GRAFFARD')) return 90;
  if (u.includes('PANTALL') || u.includes('BRANDT') || u.includes('HERMANS')) return 85;
  return 50;
}

function computeKairos(horse) {
  const m = analyzeMusique(horse.musique);
  const score = {};

  let f = 0;
  if (horse.musique) {
    const chars = horse.musique.replace(/[^1-9p]/g, '').split('');
    const recent = chars.filter(c => /[1-9p]/.test(c)).slice(-5);
    const weights = [1, 1, 1, 2, 3];
    recent.forEach((ch, i) => {
      const w = weights[i] || 1;
      if (ch === '1') f += 30 * w; else if (ch === '2') f += 18 * w;
      else if (ch === '3') f += 10 * w; else if (ch === 'p') f += 7 * w;
    });
    if (m.serie >= 3) f += 50; else if (m.serie >= 2) f += 25;
  }
  score.forme = Math.min(Math.round(f), 200);
  score.regularite = Math.min(Math.round(m.reg * 1.5), 150);
  score.victoires = Math.min(Math.round((m.nb > 0 ? m.v / m.nb : 0) * 200), 100);
  score.places = Math.min(Math.round((m.nb > 0 ? m.p / m.nb : 0) * 150), 100);
  score.jockey = getJockeyScore(horse.jockey);
  score.entraineur = getTrainerScore(horse.trainer);
  score.distance = m.tendance === 'excellent' ? 75 : m.tendance === 'bon' ? 50 : 25;
  score.terrain = 50;
  score.vh = horse.vh > 40 ? 50 : horse.vh > 20 ? 35 : horse.vh > 0 ? 20 : 15;
  const ip = 1 / Math.max(horse.odds, 1.01);
  const kp = Math.min(Object.values(score).reduce((a, b) => a + b, 0) / 1000, 0.95);
  score.value = (kp - ip) > 0.2 ? 50 : (kp - ip) > 0.1 ? 35 : 20;

  let pen = 0;
  const topTrainer = getTrainerScore(horse.trainer) >= 90;
  if (horse.odds < 1.5) pen -= topTrainer ? 50 : 100;
  if (horse.vh === 0 && topTrainer) pen += 10;

  const total = Math.min(Math.max(Object.values(score).reduce((a, b) => a + b, 0) + pen, 100), 1000);
  return { scores: score, total };
}

// ── APPEL GEMINI ───────────────────────────────────────────────
async function callGemini(horses, courseName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquant');

  const horsesText = horses.map(h =>
    `#${h.num} ${h.nom} | Jockey: ${h.jockey} | Entraîneur: ${h.trainer} | Cote: ${h.odds} | VH: ${h.vh} | Musique: ${h.musique || 'N/A'} | KAIROS: ${h.kairosIndex}/1000`
  ).join('\n');

  const prompt = `Tu es GEMINI, expert en courses de chevaux belges (EuroTiercé).
Course : ${courseName || 'Course hippique'}
Partants :
${horsesText}

IMPORTANT : Tu dois répondre UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.

Analyse chaque cheval et retourne ce JSON exact :
{
  "analyses": [
    {
      "num": 1,
      "nom": "NOM_CHEVAL",
      "score_gemini": 850,
      "niveau_confiance": 80,
      "signal": "FORT",
      "points_forts": ["forme récente excellente", "jockey top"],
      "points_faibles": ["cote trop basse"],
      "verdict": "Texte du verdict en français"
    }
  ],
  "top3_gemini": [1, 2, 3],
  "insight_course": "Observation générale sur la course en 1 phrase"
}

Règles :
- score_gemini entre 100 et 1000
- niveau_confiance entre 0 et 100
- signal : FORT / MOYEN / FAIBLE
- top3_gemini : numéros des 3 meilleurs chevaux selon toi
- Tiens compte des leçons : VH 0 + Fabre/Rouget = ne pas pénaliser, sur-favori cote <1.5 sans top entraîneur = PIÈGE`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
    })
  });

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── APPEL OPENAI ────────────────────────────────────────────────
async function callOpenAI(horses, courseName) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY manquant');

  const horsesText = horses.map(h =>
    `#${h.num} ${h.nom} | Jockey: ${h.jockey} | Entraîneur: ${h.trainer} | Cote: ${h.odds} | VH: ${h.vh} | Musique: ${h.musique || 'N/A'} | KAIROS: ${h.kairosIndex}/1000`
  ).join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `Tu es GPT, expert en statistiques de courses de chevaux belges (EuroTiercé). Tu joues le rôle de validateur statistique. Tu dois répondre UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.`
        },
        {
          role: 'user',
          content: `Course : ${courseName || 'Course hippique'}
Partants :
${horsesText}

Analyse statistique de chaque cheval et retourne ce JSON exact :
{
  "analyses": [
    {
      "num": 1,
      "nom": "NOM_CHEVAL",
      "score_openai": 850,
      "niveau_confiance": 80,
      "signal": "FORT",
      "probabilite_victoire": 25,
      "probabilite_place": 55,
      "value_bet": true,
      "verdict": "Texte du verdict statistique en français"
    }
  ],
  "top3_openai": [1, 2, 3],
  "fiabilite_course": 75,
  "commentaire_stats": "Observation statistique générale en 1 phrase"
}

Règles :
- score_openai entre 100 et 1000
- niveau_confiance entre 0 et 100
- signal : FORT / MOYEN / FAIBLE
- probabilite_victoire et probabilite_place en % (cohérents avec la cote)
- value_bet : true si cote > valeur réelle estimée
- top3_openai : numéros des 3 meilleurs chevaux selon analyse statistique
- fiabilite_course : 0-100 (qualité globale de la course pour parier)`
        }
      ]
    })
  });

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ── CONSENSUS ENGINE ─────────────────────────────────────────────
function buildConsensus(horses, kairosResults, geminiResults, openaiResults) {
  return horses.map(horse => {
    const k = { score: horse.kairosIndex, signal: horse.kairosIndex >= 850 ? 'FORT' : horse.kairosIndex >= 700 ? 'MOYEN' : 'FAIBLE' };

    const g = geminiResults?.analyses?.find(a => a.num === horse.num) || { score_gemini: 500, signal: 'MOYEN', niveau_confiance: 50, points_forts: [], points_faibles: [], verdict: '' };
    const o = openaiResults?.analyses?.find(a => a.num === horse.num) || { score_openai: 500, signal: 'MOYEN', niveau_confiance: 50, probabilite_victoire: 10, probabilite_place: 25, value_bet: false, verdict: '' };

    // Score consensus pondéré : KAIROS 40% + Gemini 30% + OpenAI 30%
    const scoreConsensus = Math.round(k.score * 0.4 + (g.score_gemini || 500) * 0.3 + (o.score_openai || 500) * 0.3);

    // Vote majoritaire (2/3)
    const signals = [k.signal, g.signal || 'MOYEN', o.signal || 'MOYEN'];
    const fortCount = signals.filter(s => s === 'FORT').length;
    const faibleCount = signals.filter(s => s === 'FAIBLE').length;

    let signalFinal, niveauConsensus, couleurConsensus;
    if (fortCount >= 2) { signalFinal = 'FORT'; niveauConsensus = fortCount === 3 ? 'UNANIME' : 'MAJORITAIRE'; couleurConsensus = '#00FFB2'; }
    else if (faibleCount >= 2) { signalFinal = 'FAIBLE'; niveauConsensus = faibleCount === 3 ? 'UNANIME' : 'MAJORITAIRE'; couleurConsensus = '#FF4D6D'; }
    else { signalFinal = 'MOYEN'; niveauConsensus = 'PARTAGÉ'; couleurConsensus = '#FFD700'; }

    // Confiance globale
    const confianceMoy = Math.round(((k.score / 10) + (g.niveau_confiance || 50) + (o.niveau_confiance || 50)) / 3);

    // In top3 de chaque IA ?
    const inKairosTop3 = horse.rank <= 3;
    const inGeminiTop3 = geminiResults?.top3_gemini?.includes(horse.num) || false;
    const inOpenAITop3 = openaiResults?.top3_openai?.includes(horse.num) || false;
    const top3Count = [inKairosTop3, inGeminiTop3, inOpenAITop3].filter(Boolean).length;

    return {
      ...horse,
      scoreConsensus,
      signalFinal,
      niveauConsensus,
      couleurConsensus,
      confianceMoy,
      top3Count,
      inKairosTop3,
      inGeminiTop3,
      inOpenAITop3,
      votes: { kairos: k.signal, gemini: g.signal || 'MOYEN', openai: o.signal || 'MOYEN' },
      geminiVerdict: g.verdict || '',
      openaiVerdict: o.verdict || '',
      probVictoire: o.probabilite_victoire || Math.round(scoreConsensus / 12),
      probPlace: o.probabilite_place || Math.round(scoreConsensus / 8),
      valueBet: o.value_bet || false,
      pointsForts: g.points_forts || [],
      pointsFaibles: g.points_faibles || [],
    };
  }).sort((a, b) => b.scoreConsensus - a.scoreConsensus);
}

// ── HANDLER PRINCIPAL ────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { horses, courseName } = req.body;
  if (!horses || horses.length < 2) return res.status(400).json({ error: 'Minimum 2 chevaux requis' });

  // Ajouter rang KAIROS
  const sortedByKairos = [...horses].sort((a, b) => b.kairosIndex - a.kairosIndex);
  const horsesWithRank = horses.map(h => ({
    ...h,
    rank: sortedByKairos.findIndex(s => s.num === h.num) + 1
  }));

  // Lancer les 3 IA en parallèle
  const [geminiResult, openaiResult] = await Promise.allSettled([
    callGemini(horsesWithRank, courseName),
    callOpenAI(horsesWithRank, courseName)
  ]);

  const geminiData = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
  const openaiData = openaiResult.status === 'fulfilled' ? openaiResult.value : null;

  // Construire le consensus
  const horsesConsensus = buildConsensus(horsesWithRank, null, geminiData, openaiData);

  // Insight global
  const top1 = horsesConsensus[0];
  const unanimes = horsesConsensus.filter(h => h.niveauConsensus === 'UNANIME' && h.signalFinal === 'FORT');

  return res.status(200).json({
    success: true,
    horses: horsesConsensus,
    meta: {
      courseName: courseName || 'Course hippique',
      nbPartants: horses.length,
      geminiOk: geminiResult.status === 'fulfilled',
      openaiOk: openaiResult.status === 'fulfilled',
      geminiInsight: geminiData?.insight_course || '',
      openaiCommentaire: openaiData?.commentaire_stats || '',
      fiabiliteCourse: openaiData?.fiabilite_course || 70,
      unanimes: unanimes.map(h => h.nom),
      top1Consensus: top1?.nom || '',
      top3Consensus: horsesConsensus.slice(0, 3).map(h => h.num),
    }
  });
}
