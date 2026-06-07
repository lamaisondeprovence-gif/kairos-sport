// /api/horses-ticket.js — V2 PROFESSIONAL
// Analyse professionnelle + tous types de paris + seuil silence intelligent

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { budget = 100 } = req.body || req.query || {};

  try {
    const liveRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://kairos-sport.vercel.app'}/api/horses-live`, { cache: 'no-store' });
    const liveData = await liveRes.json();

    if (!liveData.success || !liveData.races?.length) {
      return res.status(200).json({ success: false, silence: true, message: 'Aucune course disponible.' });
    }

    const budgetNum = parseFloat(budget) || 100;
    const racesWithTickets = liveData.races.map(race => buildRaceAnalysis(race, budgetNum));

    // Vérifier s'il y a des opportunités
    const bestEdge = Math.max(...racesWithTickets.map(r => r.bestEdge || 0));
    
    if (bestEdge < 0.05) {
      return res.status(200).json({
        success: true, silence: true,
        message: `Aucun pari valable aujourd'hui. Edge maximum: ${(bestEdge * 100).toFixed(1)}%. KAIROS protège votre bankroll.`,
        bestEdge,
      });
    }

    const bestRace = racesWithTickets.reduce((a, b) => (b.bestIndex > a.bestIndex ? b : a), racesWithTickets[0]);

    return res.status(200).json({
      success: true, silence: false,
      bestRace,
      allRaces: racesWithTickets,
      source: liveData.source,
      generatedAt: new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }),
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function buildRaceAnalysis(race, budget) {
  const horses = race.horses || [];
  if (horses.length === 0) return { ...race, tickets: [], bestIndex: 0, bestEdge: 0 };

  const sorted = [...horses].sort((a, b) => b.kairosIndex - a.kairosIndex);
  const bestIndex = sorted[0]?.kairosIndex || 0;
  const n = sorted.length;

  // Calcul edge moyen
  const bestEdge = sorted[0] ? Math.max(0, (sorted[0].kairosIndex / 1000) - (1 / sorted[0].odds)) : 0;

  // Kelly selon indice
  const kelly = bestIndex >= 900 ? 0.08 : bestIndex >= 800 ? 0.06 : bestIndex >= 700 ? 0.04 : bestIndex >= 600 ? 0.02 : 0.01;

  const tickets = [];

  // ── SIMPLE GAGNANT ──
  const sg = sorted[0];
  tickets.push({
    type: 'Simple Gagnant', emoji: '🎯',
    horses: [pick(sg)],
    mise: round(budget * kelly),
    gainPotentiel: round(budget * kelly * sg.odds * 0.9),
    confiance: getLabel(sg.kairosIndex),
    conseil: sg.verdict,
    recommended: bestIndex >= 850,
    edge: round(bestEdge * 100),
  });

  // ── SIMPLE PLACÉ ──
  tickets.push({
    type: 'Simple Placé', emoji: '🥉',
    horses: [pick(sg)],
    mise: round(budget * kelly * 0.5),
    gainPotentiel: round(budget * kelly * 0.5 * Math.min(sg.odds * 0.33, 3.0) * 0.9),
    confiance: getLabel(sg.kairosIndex),
    conseil: 'Pari sécurisé — finir dans les 3 premiers suffit.',
    recommended: bestIndex >= 700 && bestIndex < 850,
    edge: round(bestEdge * 60),
  });

  // ── COUPLÉ GAGNANT ORDRE ──
  if (n >= 2) {
    const [h1, h2] = sorted;
    tickets.push({
      type: 'Couplé Gagnant Ordre', emoji: '🔢',
      horses: [pick(h1), pick(h2)],
      mise: round(budget * kelly * 0.6),
      gainPotentiel: round(budget * kelly * 0.6 * h1.odds * h2.odds * 0.2 * 0.9),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex) / 2)),
      conseil: `${h1.name} 1er, ${h2.name} 2ème — ordre exact requis.`,
      recommended: h1.kairosIndex >= 800 && h2.kairosIndex >= 700,
      edge: round(bestEdge * 50),
    });
  }

  // ── COUPLÉ PLACÉ DÉSORDRE ──
  if (n >= 2) {
    const [h1, h2] = sorted;
    tickets.push({
      type: 'Couplé Placé Désordre', emoji: '🔀',
      horses: [pick(h1), pick(h2)],
      mise: round(budget * kelly * 0.5),
      gainPotentiel: round(budget * kelly * 0.5 * h1.odds * h2.odds * 0.12 * 0.9),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex) / 2)),
      conseil: `${h1.name} et ${h2.name} dans les 2 premiers — ordre libre.`,
      recommended: h1.kairosIndex >= 750 && h2.kairosIndex >= 650,
      edge: round(bestEdge * 45),
    });
  }

  // ── TRIO ──
  if (n >= 3) {
    const top3 = sorted.slice(0, 3);
    tickets.push({
      type: 'Trio', emoji: '🏅',
      horses: top3.map(pick),
      mise: round(budget * kelly * 0.35),
      gainPotentiel: round(budget * kelly * 0.35 * top3[0].odds * 3 * 0.9),
      confiance: getLabel(Math.round(top3.reduce((a, h) => a + h.kairosIndex, 0) / 3)),
      conseil: `Top 3 KAIROS dans les 3 premiers — ordre libre.`,
      recommended: top3[2].kairosIndex >= 650,
      edge: round(bestEdge * 40),
    });
  }

  // ── TIERCÉ ORDRE ──
  if (n >= 3) {
    const [h1, h2, h3] = sorted;
    tickets.push({
      type: 'Tiercé Ordre', emoji: '🏆',
      horses: [pick(h1), pick(h2), pick(h3)],
      mise: round(budget * kelly * 0.4),
      gainPotentiel: round(budget * kelly * 0.4 * h1.odds * 5 * 0.9),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex + h3.kairosIndex) / 3)),
      conseil: `${h1.name}, ${h2.name}, ${h3.name} — ordre exact.`,
      recommended: h1.kairosIndex >= 800,
      edge: round(bestEdge * 35),
    });
  }

  // ── SUPER4 — UNIQUEMENT SI 4 CHEVAUX >850 ──
  if (n >= 4) {
    const top4 = sorted.slice(0, 4);
    const allStrong = top4.every(h => h.kairosIndex >= 850);
    tickets.push({
      type: 'Super4', emoji: '4️⃣',
      horses: top4.map(pick),
      mise: round(budget * kelly * 0.3),
      gainPotentiel: round(budget * kelly * 0.3 * top4[0].odds * 15 * 0.9),
      confiance: getLabel(Math.round(top4.reduce((a, h) => a + h.kairosIndex, 0) / 4)),
      conseil: allStrong
        ? '4 chevaux solides détectés — Super4 recommandé !'
        : '⚠️ Indice insuffisant sur certains chevaux — préférer le Quinté+ Désordre.',
      recommended: allStrong,
      edge: round(bestEdge * 40),
      deepLink: race.deepLink || 'https://www.eurotierce.be',
    });
  }

  // ── QUINTÉ+ DÉSORDRE — RECOMMANDÉ SI 5+ PARTANTS ──
  if (n >= 5) {
    const top5 = sorted.slice(0, 5);
    tickets.push({
      type: 'Quinté+ Désordre', emoji: '🌟',
      horses: top5.map(pick),
      mise: round(budget * kelly * 0.2),
      gainPotentiel: round(budget * kelly * 0.2 * top5[0].odds * 25 * 0.9),
      confiance: getLabel(Math.round(top5.reduce((a, h) => a + h.kairosIndex, 0) / 5)),
      conseil: 'Top 5 KAIROS dans les 5 premiers — ordre libre. Jackpot possible !',
      recommended: true, // TOUJOURS RECOMMANDÉ
      edge: round(bestEdge * 30),
      deepLink: race.deepLink || 'https://www.eurotierce.be',
    });
  }

  // ── QUINTÉ+ ORDRE ──
  if (n >= 5) {
    const top5 = sorted.slice(0, 5);
    tickets.push({
      type: 'Quinté+ Ordre', emoji: '💎',
      horses: top5.map(pick),
      mise: round(budget * kelly * 0.15),
      gainPotentiel: round(budget * kelly * 0.15 * top5[0].odds * 50 * 0.9),
      confiance: getLabel(Math.round(top5.reduce((a, h) => a + h.kairosIndex, 0) / 5)),
      conseil: 'Top 5 dans l\'ordre exact — gain jackpot maximum.',
      recommended: false,
      edge: round(bestEdge * 10),
      deepLink: race.deepLink || 'https://www.eurotierce.be',
    });
  }

  // Évaluation complète tous les chevaux
  const evaluation = sorted.map((h, i) => ({
    rank: i + 1,
    num: h.num, name: h.name, jockey: h.jockey, trainer: h.trainer,
    odds: h.odds, vh: h.vh, musique: h.musique,
    age: h.age, sexe: h.sexe, poids: h.poids,
    nbCourses: h.nbCourses, nbVictoires: h.nbVictoires,
    nbPlaces: h.nbPlaces, regularite: h.regularite,
    kairosIndex: h.kairosIndex,
    kairosDetail: h.kairosScore,
    kairosLabel: getLabel(h.kairosIndex),
    explanation: h.explanation,
    verdict: h.verdict,
    probVictoire: round(Math.min(h.kairosIndex / 1200, 0.85) * 100),
    probTop3: round(Math.min(h.kairosIndex / 800, 0.95) * 100),
    isTrap: h.odds < 1.5 && h.kairosIndex < 700,
    isValue: h.odds > 5 && h.kairosIndex >= 750,
    isCoup: h.odds_movement < -0.35,
    indiceRisque: 100 - Math.min(h.regularite, 100),
    indiceConfiance: Math.round(h.kairosIndex / 10),
  }));

  const recommended = tickets.find(t => t.recommended) || tickets[0];

  return {
    id: race.id, name: race.name, track: race.track,
    time: race.time, countdown: race.countdown,
    distance: race.distance, going: race.going, prize: race.prize,
    country: race.country, deepLink: race.deepLink,
    nbParticipants: n, bestIndex, bestEdge,
    recommended, tickets, evaluation,
    traps: evaluation.filter(e => e.isTrap),
    valueBets: evaluation.filter(e => e.isValue),
    coups: evaluation.filter(e => e.isCoup),
    narrative: buildNarrative(sorted[0], race, bestIndex),
  };
}

function pick(h) {
  return { num: h.num, name: h.name, jockey: h.jockey, trainer: h.trainer, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, musique: h.musique, regularite: h.regularite, verdict: h.verdict };
}

function round(v) { return parseFloat((v || 0).toFixed(2)); }

function getLabel(index) {
  if (index >= 950) return 'EXCEPTIONNEL 🟢';
  if (index >= 900) return 'TRÈS FORT 🟢';
  if (index >= 850) return 'BONNE OPPORTUNITÉ 🟢';
  if (index >= 800) return 'JOUABLE 🟡';
  if (index >= 700) return 'RISQUÉ 🟠';
  if (index >= 600) return 'TRÈS RISQUÉ 🟠';
  return 'ÉVITER 🔴';
}

function buildNarrative(horse, race, index) {
  if (!horse) return '';
  return horse.explanation || `${horse.name} est le choix KAIROS avec ${index}/1000.`;
}
