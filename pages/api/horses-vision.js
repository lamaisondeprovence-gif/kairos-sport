// /api/horses-vision.js
// Gemini Vision lit la photo EuroTiercé et extrait tous les chevaux
// GRATUIT — utilise GEMINI_API_KEY déjà dans Vercel

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, budget = 100 } = req.body;
    if (!image) return res.status(400).json({ success: false, error: 'Image manquante' });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return res.status(500).json({ success: false, error: 'GEMINI_API_KEY manquante' });

    // Extraire base64 pur
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // 1. Envoyer la photo à Gemini Vision (GRATUIT)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                }
              },
              {
                text: `Analyse cette page EuroTiercé et extrait TOUTES les données des chevaux en JSON strict.

Retourne UNIQUEMENT ce JSON sans markdown ni explication :
{
  "course": {
    "nom": "PRIX XXX",
    "piste": "LONGCHAMP",
    "heure": "14:03",
    "distance": "2000m",
    "terrain": "Bon souple",
    "participants": 9,
    "prize": "50300€"
  },
  "chevaux": [
    {
      "num": 1,
      "nom": "NOM DU CHEVAL",
      "jockey": "M.BARZALONA",
      "entraineur": "FH.GRAFFARD",
      "sexe": "H",
      "age": 3,
      "poids": 56,
      "corde": 2,
      "vh": 43.5,
      "musique": "3p1p1p2p",
      "cote": 5.4
    }
  ]
}

IMPORTANT: 
- Extrais TOUS les chevaux visibles
- VH format: nombre décimal (ex: 43.5, 0, 46)
- Musique: la séquence complète de chiffres et p
- Cote: le nombre en vert/orange à droite
- Si une valeur n'est pas visible, mets null`
              }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 2. Parser la réponse JSON de Claude
    let extracted;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      throw new Error('Impossible de parser la réponse Claude');
    }

    if (!extracted.chevaux || extracted.chevaux.length === 0) {
      throw new Error('Aucun cheval détecté dans l\'image');
    }

    // 3. Calculer les indices KAIROS pour chaque cheval
    const going = extracted.course?.terrain || 'Bon';
    const horses = extracted.chevaux.map(ch => {
      const musiqueAnalysis = analyzeMusiqueProf(ch.musique || '');
      const horse = {
        id: `vision_${ch.num}`,
        num: ch.num,
        name: ch.nom || `Cheval ${ch.num}`,
        jockey: formatName(ch.jockey || ''),
        trainer: formatName(ch.entraineur || ''),
        musique: ch.musique || '',
        odds: parseFloat(ch.cote) || 5.0,
        odds_movement: ch.cote < 2 ? -0.3 : 0,
        vh: parseFloat(ch.vh) || 0,
        age: ch.age || 4,
        sexe: ch.sexe || 'H',
        poids: ch.poids || 56,
        corde: ch.corde || ch.num,
        going_preference: 'any',
        hasRealOdds: true,
        ...musiqueAnalysis,
      };
      horse.kairosScore = computeKairosProf(horse, going);
      horse.kairosIndex = horse.kairosScore.total;
      horse.explanation = generateExplanation(horse);
      horse.verdict = generateVerdict(horse);
      return horse;
    }).sort((a, b) => b.kairosIndex - a.kairosIndex);

    // 4. Générer l'analyse narrative avec Gemini (GRATUIT)
    let narrative = '';
    try {
      const narrativeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Tu es KAIROS, expert hippique belge. Analyse en 3 phrases max en français.

Course: ${extracted.course?.nom} - ${extracted.course?.piste} - ${extracted.course?.distance}
Top 3:
1. ${horses[0]?.name} @${horses[0]?.odds} - VH:${horses[0]?.vh} - ${horses[0]?.jockey} - ${horses[0]?.kairosIndex}/1000
2. ${horses[1]?.name} @${horses[1]?.odds} - VH:${horses[1]?.vh} - ${horses[1]?.jockey} - ${horses[1]?.kairosIndex}/1000
3. ${horses[2]?.name} @${horses[2]?.odds} - VH:${horses[2]?.vh} - ${horses[2]?.jockey} - ${horses[2]?.kairosIndex}/1000

Donne ton verdict de pari. Sois direct et concis.`
              }]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
          })
        }
      );
      if (narrativeRes.ok) {
        const nd = await narrativeRes.json();
        narrative = nd.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch {}

    // 5. Générer les tickets
    const budgetNum = parseFloat(budget) || 100;
    const tickets = generateTickets(horses, budgetNum, extracted.course);

    return res.status(200).json({
      success: true,
      source: 'claude_vision',
      course: extracted.course,
      horses,
      tickets,
      narrative,
      bestHorse: horses[0],
      bestIndex: horses[0]?.kairosIndex || 0,
      generatedAt: new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }),
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── GÉNÉRATION TICKETS ───────────────────────────────────────────
function generateTickets(horses, budget, course) {
  const n = horses.length;
  const bestIndex = horses[0]?.kairosIndex || 0;
  const kelly = bestIndex >= 900 ? 0.08 : bestIndex >= 800 ? 0.06 : bestIndex >= 700 ? 0.04 : 0.02;
  const tickets = [];

  // Simple Gagnant
  tickets.push({
    type: 'Simple Gagnant', emoji: '🎯',
    horses: [horses[0]].map(pickH),
    mise: round(budget * kelly),
    gainPotentiel: round(budget * kelly * (horses[0]?.odds || 3) * 0.9),
    recommended: bestIndex >= 850,
    conseil: horses[0]?.verdict || '',
  });

  // Quinté+ Désordre
  if (n >= 5) {
    const top5 = horses.slice(0, 5);
    tickets.push({
      type: 'Quinté+ Désordre', emoji: '🌟',
      horses: top5.map(pickH),
      mise: round(budget * kelly * 0.2),
      gainPotentiel: round(budget * kelly * 0.2 * (horses[0]?.odds || 5) * 20 * 0.9),
      recommended: true,
      conseil: 'Top 5 KAIROS — ordre libre. Jackpot possible !',
    });
  }

  // Super4
  if (n >= 4) {
    const top4 = horses.slice(0, 4);
    const allStrong = top4.every(h => h.kairosIndex >= 850);
    tickets.push({
      type: 'Super4', emoji: '4️⃣',
      horses: top4.map(pickH),
      mise: round(budget * kelly * 0.3),
      gainPotentiel: round(budget * kelly * 0.3 * (horses[0]?.odds || 5) * 12 * 0.9),
      recommended: allStrong,
      conseil: allStrong ? '4 chevaux solides !' : '⚠️ Préférer Quinté+ Désordre',
    });
  }

  // Couplé Désordre
  if (n >= 2) {
    tickets.push({
      type: 'Couplé Désordre', emoji: '🔀',
      horses: horses.slice(0, 2).map(pickH),
      mise: round(budget * kelly * 0.5),
      gainPotentiel: round(budget * kelly * 0.5 * horses[0]?.odds * horses[1]?.odds * 0.15 * 0.9),
      recommended: horses[1]?.kairosIndex >= 700,
      conseil: `${horses[0]?.name} + ${horses[1]?.name} dans les 2 premiers.`,
    });
  }

  return tickets;
}

function pickH(h) {
  return { num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, musique: h.musique };
}

function round(v) { return parseFloat((v || 0).toFixed(2)); }

// ── ALGO KAIROS ──────────────────────────────────────────────────
function analyzeMusiqueProf(musique) {
  if (!musique) return { nbCourses: 0, nbVictoires: 0, nbPlaces: 0, regularite: 0, tendance: 'inconnu', serieActuelle: 0 };
  const chars = musique.replace(/[^1-9p]/g, '').split('');
  let nbCourses = 0, nbVictoires = 0, nbPlaces = 0;
  for (const ch of chars) {
    if (/[1-9]/.test(ch)) { nbCourses++; if (ch === '1') nbVictoires++; if (['2','3'].includes(ch)) nbPlaces++; }
    if (ch === 'p') nbPlaces++;
  }
  const regularite = nbCourses > 0 ? Math.round((nbVictoires + nbPlaces) / nbCourses * 100) : 0;
  const recent = chars.filter(c => /[1-9]/.test(c)).slice(-3);
  const avgRecent = recent.reduce((a, c) => a + parseInt(c), 0) / Math.max(recent.length, 1);
  const tendance = avgRecent <= 2 ? 'excellent' : avgRecent <= 4 ? 'bon' : 'moyen';
  let serieActuelle = 0;
  const allR = chars.filter(c => /[1-9]/.test(c));
  for (let i = allR.length - 1; i >= 0; i--) { if (['1','2','3'].includes(allR[i])) serieActuelle++; else break; }
  return { nbCourses, nbVictoires, nbPlaces, regularite, tendance, serieActuelle };
}

function computeKairosProf(horse, going) {
  const score = {};
  score.forme = 0;
  if (horse.musique) {
    const chars = horse.musique.replace(/[^1-9p]/g, '').split('');
    const recent = chars.filter(c => /[1-9p]/.test(c)).slice(-5);
    const weights = [1, 1, 1, 2, 3];
    let f = 0;
    recent.forEach((ch, i) => {
      const w = weights[i] || 1;
      if (ch === '1') f += 30 * w; else if (ch === '2') f += 18 * w;
      else if (ch === '3') f += 10 * w; else if (ch === 'p') f += 7 * w;
    });
    if (horse.serieActuelle >= 3) f += 50; else if (horse.serieActuelle >= 2) f += 25;
    score.forme = Math.min(Math.round(f), 200);
  }
  score.regularite = Math.min(Math.round(horse.regularite * 1.5), 150);
  score.victoires = Math.min(Math.round((horse.nbCourses > 0 ? horse.nbVictoires / horse.nbCourses : 0) * 200), 100);
  score.places = Math.min(Math.round((horse.nbCourses > 0 ? horse.nbPlaces / horse.nbCourses : 0) * 150), 100);
  score.jockey = getJockeyScore(horse.jockey);
  score.entraineur = getTrainerScore(horse.trainer);
  score.distance = horse.tendance === 'excellent' ? 75 : horse.tendance === 'bon' ? 50 : 25;
  score.terrain = 50;
  score.confrontations = horse.vh > 40 ? 50 : horse.vh > 20 ? 35 : horse.vh > 0 ? 20 : 15;
  const impliedProb = 1 / horse.odds;
  const kairosProb = Math.min(Object.values(score).reduce((a, b) => a + b, 0) / 1000, 0.95);
  score.valueBet = (kairosProb - impliedProb) > 0.2 ? 50 : (kairosProb - impliedProb) > 0.1 ? 35 : 20;
  let penalites = 0;
  const isTopTrainer = getTrainerScore(horse.trainer) >= 90;
  if (horse.odds < 1.5) penalites -= isTopTrainer ? 50 : 100;
  if (horse.vh === 0 && isTopTrainer) penalites += 10;
  const total = Math.min(Math.max(Object.values(score).reduce((a, b) => a + b, 0) + penalites, 100), 1000);
  return { ...score, penalites, total };
}

function generateExplanation(horse) {
  const parts = [];
  if (horse.nbCourses > 0) parts.push(`${horse.nbVictoires}V/${horse.nbPlaces}P sur ${horse.nbCourses} courses (${horse.regularite}%)`);
  if (horse.vh > 40) parts.push(`VH ${horse.vh} — très expérimenté`);
  else if (horse.vh === 0 && getTrainerScore(horse.trainer) >= 90) parts.push(`VH 0 mais entraîneur de référence`);
  if (horse.serieActuelle >= 2) parts.push(`${horse.serieActuelle} podiums consécutifs 🔥`);
  if (getJockeyScore(horse.jockey) >= 80) parts.push(`${horse.jockey} = jockey élite`);
  if (horse.odds > 8 && horse.kairosScore?.total >= 700) parts.push(`Outsider sous-coté 💎`);
  return parts.join('. ') + (parts.length ? '.' : '');
}

function generateVerdict(horse) {
  const idx = horse.kairosScore?.total || 0;
  const isTopTrainer = getTrainerScore(horse.trainer) >= 90;
  if (horse.odds < 1.5 && !isTopTrainer) return '🔴 PIÈGE — sur-favori sans entraîneur de référence.';
  if (horse.odds < 1.5 && isTopTrainer) return '⚠️ FAVORI — entraîneur top. Simple Placé sécurisé.';
  if (idx >= 900) return '🟢 EXCEPTIONNEL — jouer sans hésiter.';
  if (idx >= 850) return '🟢 TRÈS FORT — Simple Gagnant recommandé.';
  if (idx >= 800) return '🟡 JOUABLE — bon dans un combiné.';
  if (idx >= 700) return '🟠 RISQUÉ — uniquement en Quinté/Super4.';
  return '⚪ OBSERVATION.';
}

function getJockeyScore(j) {
  if (!j) return 10;
  const u = j.toUpperCase();
  if (u.includes('DEMURO') || u.includes('SOUMILLON')) return 100;
  if (u.includes('GUYON') || u.includes('POUCHIN')) return 90;
  if (u.includes('BARZALONA') || u.includes('LEMAIRE')) return 85;
  if (u.includes('PESLIER') || u.includes('PASQUIER')) return 80;
  if (u.includes('DETTORI') || u.includes('MOORE')) return 95;
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

function formatName(raw) {
  if (!raw) return '';
  return raw.replace(/([A-Z]+)/g, w => w[0] + w.slice(1).toLowerCase())
            .replace(/\.([a-z])/g, (_, c) => `. ${c.toUpperCase()}`).trim();
}
