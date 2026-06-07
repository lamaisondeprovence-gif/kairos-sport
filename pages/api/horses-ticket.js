// /api/horses-ticket.js — v4
// Génère TOUS les types de paris pour chaque course
// Simple, Couplé O/D, Tiercé O/D, Quarté+, Quinté+ O/D + évaluation complète

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
    const racesWithTickets = liveData.races.map(race => buildRaceTickets(race, budgetNum));

    // Meilleure opportunité globale
    const best = racesWithTickets.reduce((a, b) => (b.bestIndex > a.bestIndex ? b : a), racesWithTickets[0]);

    return res.status(200).json({
      success: true,
      silence: false,
      bestRace: best,
      allRaces: racesWithTickets,
      source: liveData.source,
      generatedAt: new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }),
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function buildRaceTickets(race, budget) {
  const horses = race.horses || [];
  if (horses.length === 0) return { ...race, tickets: [], bestIndex: 0 };

  const sorted = [...horses].sort((a, b) => b.kairosIndex - a.kairosIndex);
  const bestIndex = sorted[0]?.kairosIndex || 0;
  const n = sorted.length;

  // Kelly fractions selon indice
  const kelly = bestIndex >= 900 ? 0.08 : bestIndex >= 800 ? 0.06 : bestIndex >= 700 ? 0.04 : bestIndex >= 600 ? 0.02 : 0.01;

  const tickets = [];

  // ── 1. SIMPLE GAGNANT ──────────────────────────────────────────
  const sg = sorted[0];
  tickets.push({
    type: 'Simple Gagnant',
    emoji: '🎯',
    horses: [{ num: sg.num, name: sg.name, jockey: sg.jockey, odds: sg.odds, kairosIndex: sg.kairosIndex, vh: sg.vh, forme: sg.forme }],
    mise: parseFloat((budget * kelly).toFixed(2)),
    gainPotentiel: parseFloat((budget * kelly * sg.odds * 0.9).toFixed(2)),
    confiance: getLabel(sg.kairosIndex),
    conseil: buildAdvice(sg, race, 'simple'),
    recommended: bestIndex >= 850,
  });

  // ── 2. SIMPLE PLACÉ ────────────────────────────────────────────
  tickets.push({
    type: 'Simple Placé',
    emoji: '🥉',
    horses: [{ num: sg.num, name: sg.name, jockey: sg.jockey, odds: sg.odds, kairosIndex: sg.kairosIndex, vh: sg.vh, forme: sg.forme }],
    mise: parseFloat((budget * kelly * 0.5).toFixed(2)),
    gainPotentiel: parseFloat((budget * kelly * 0.5 * Math.min(sg.odds * 0.35, 3.0) * 0.9).toFixed(2)),
    confiance: getLabel(sg.kairosIndex),
    conseil: 'Pari sécurisé — le cheval doit finir dans les 3 premiers.',
    recommended: bestIndex >= 700,
  });

  // ── 3. COUPLÉ ORDRE ────────────────────────────────────────────
  if (n >= 2) {
    const [h1, h2] = sorted;
    const gainCouple = parseFloat((budget * kelly * 0.6 * h1.odds * h2.odds * 0.25 * 0.9).toFixed(2));
    tickets.push({
      type: 'Couplé Ordre',
      emoji: '🔢',
      horses: [h1, h2].map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.6).toFixed(2)),
      gainPotentiel: gainCouple,
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex) / 2)),
      conseil: `${h1.name} 1er, ${h2.name} 2ème — dans cet ordre exact.`,
      recommended: h1.kairosIndex >= 800 && h2.kairosIndex >= 700,
    });
  }

  // ── 4. COUPLÉ DÉSORDRE ─────────────────────────────────────────
  if (n >= 2) {
    const [h1, h2] = sorted;
    tickets.push({
      type: 'Couplé Désordre',
      emoji: '🔀',
      horses: [h1, h2].map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.5).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.5 * h1.odds * h2.odds * 0.15 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex) / 2)),
      conseil: `${h1.name} et ${h2.name} dans les 2 premiers — peu importe l'ordre.`,
      recommended: h1.kairosIndex >= 750 && h2.kairosIndex >= 650,
    });
  }

  // ── 5. TIERCÉ ORDRE ────────────────────────────────────────────
  if (n >= 3) {
    const [h1, h2, h3] = sorted;
    tickets.push({
      type: 'Tiercé Ordre',
      emoji: '🏆',
      horses: [h1, h2, h3].map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.4).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.4 * h1.odds * 4 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex + h3.kairosIndex) / 3)),
      conseil: `${h1.name}, ${h2.name}, ${h3.name} — dans cet ordre exact.`,
      recommended: h1.kairosIndex >= 800,
    });
  }

  // ── 6. TIERCÉ DÉSORDRE ─────────────────────────────────────────
  if (n >= 3) {
    const [h1, h2, h3] = sorted;
    tickets.push({
      type: 'Tiercé Désordre',
      emoji: '🎲',
      horses: [h1, h2, h3].map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.35).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.35 * h1.odds * 2.5 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round((h1.kairosIndex + h2.kairosIndex + h3.kairosIndex) / 3)),
      conseil: `${h1.name}, ${h2.name}, ${h3.name} dans les 3 premiers — ordre libre.`,
      recommended: h1.kairosIndex >= 750,
    });
  }

  // ── 7. QUARTÉ+ ─────────────────────────────────────────────────
  if (n >= 4) {
    const top4 = sorted.slice(0, 4);
    tickets.push({
      type: 'Quarté+',
      emoji: '4️⃣',
      horses: top4.map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.3).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.3 * top4[0].odds * 6 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round(top4.reduce((a, h) => a + h.kairosIndex, 0) / 4)),
      conseil: `Top 4 KAIROS dans le désordre. Mise de base.`,
      recommended: n >= 4 && top4[3].kairosIndex >= 600,
    });
  }

  // ── 8. QUINTÉ+ ORDRE ───────────────────────────────────────────
  if (n >= 5) {
    const top5 = sorted.slice(0, 5);
    tickets.push({
      type: 'Quinté+ Ordre',
      emoji: '💎',
      horses: top5.map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.25).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.25 * top5[0].odds * 12 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round(top5.reduce((a, h) => a + h.kairosIndex, 0) / 5)),
      conseil: `Top 5 KAIROS dans l'ordre exact — gain maximum possible.`,
      recommended: false,
    });
  }

  // ── 9. QUINTÉ+ DÉSORDRE ────────────────────────────────────────
  if (n >= 5) {
    const top5 = sorted.slice(0, 5);
    tickets.push({
      type: 'Quinté+ Désordre',
      emoji: '🌟',
      horses: top5.map(h => ({ num: h.num, name: h.name, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh, forme: h.forme })),
      mise: parseFloat((budget * kelly * 0.2).toFixed(2)),
      gainPotentiel: parseFloat((budget * kelly * 0.2 * top5[0].odds * 7 * 0.9).toFixed(2)),
      confiance: getLabel(Math.round(top5.reduce((a, h) => a + h.kairosIndex, 0) / 5)),
      conseil: `Top 5 KAIROS dans le désordre — meilleur rapport risque/gain.`,
      recommended: n >= 5,
    });
  }

  // ── ÉVALUATION COMPLÈTE TOUS LES CHEVAUX ──────────────────────
  const evaluation = sorted.map((h, i) => ({
    rank: i + 1,
    num: h.num,
    name: h.name,
    jockey: h.jockey,
    trainer: h.trainer,
    odds: h.odds,
    vh: h.vh,
    forme: h.forme,
    kairosIndex: h.kairosIndex,
    kairosLabel: getLabel(h.kairosIndex),
    signal: getSignal(h),
    conseil: getHorseAdvice(h, i),
    isTrap: h.odds < 1.5 && h.kairosIndex < 700,
    isValue: h.odds > 5 && h.kairosIndex >= 800,
    isCoup: h.odds_movement < -0.35,
  }));

  // Ticket recommandé (le plus adapté selon indice)
  const recommended = tickets.find(t => t.recommended) || tickets[0];

  return {
    id: race.id,
    name: race.name,
    track: race.track,
    time: race.time,
    countdown: race.countdown,
    distance: race.distance,
    going: race.going,
    prize: race.prize,
    country: race.country,
    deepLink: race.deepLink,
    nbParticipants: n,
    bestIndex,
    bestHorseName: sorted[0]?.name,
    recommended,
    tickets,
    evaluation,
    traps: evaluation.filter(e => e.isTrap),
    valueBets: evaluation.filter(e => e.isValue),
    coups: evaluation.filter(e => e.isCoup),
    narrative: buildNarrative(sorted[0], race, bestIndex),
  };
}

function getSignal(horse) {
  if (horse.odds < 1.5) return '🔴 PIÈGE';
  if (horse.odds_movement < -0.35) return '🔥 COUP';
  if (horse.kairosIndex >= 900) return '🟢 EXCEPTIONNEL';
  if (horse.kairosIndex >= 850) return '🟢 TRÈS FORT';
  if (horse.kairosIndex >= 800) return '🟡 JOUABLE';
  if (horse.kairosIndex >= 700) return '🟠 RISQUÉ';
  return '⚪ OBSERVATION';
}

function getHorseAdvice(horse, rank) {
  if (horse.odds < 1.5) return 'Sur-favori sans value — éviter absolument.';
  if (rank === 0 && horse.kairosIndex >= 850) return 'Meilleur choix KAIROS — VH élevé + jockey top.';
  if (horse.vh > 40 && horse.kairosIndex >= 750) return `VH ${horse.vh} excellent — cheval très expérimenté.`;
  if (horse.odds_movement < -0.35) return 'Coup détecté — cotes en chute rapide.';
  if (horse.odds > 15 && horse.kairosIndex >= 750) return 'Outsider intéressant — value bet potentiel.';
  return 'Surveiller mais pas prioritaire.';
}

function getLabel(index) {
  if (index >= 950) return 'EXCEPTIONNEL 🟢';
  if (index >= 900) return 'TRÈS FORT 🟢';
  if (index >= 850) return 'BONNE OPPORTUNITÉ 🟢';
  if (index >= 800) return 'JOUABLE 🟡';
  if (index >= 700) return 'RISQUÉ 🟠';
  if (index >= 600) return 'TRÈS RISQUÉ 🟠';
  return 'ÉVITER 🔴';
}

function buildAdvice(horse, race, type) {
  const vh = horse.vh > 30 ? `VH ${horse.vh}. ` : '';
  const forme = horse.forme?.includes('1') ? 'Bonne forme récente. ' : '';
  return `${horse.name} @${horse.odds} — ${vh}${forme}${getLabel(horse.kairosIndex)}.`;
}

function buildNarrative(horse, race, index) {
  if (!horse) return '';
  const vh = horse.vh > 30 ? `VH ${horse.vh} — très expérimenté. ` : '';
  const forme = horse.forme?.startsWith('1') ? 'Dernière course gagnée. ' : '';
  const coup = horse.odds_movement < -0.35 ? 'Cotes en chute — coup potentiel 🔥. ' : '';
  return `${horse.name} est le choix KAIROS avec ${index}/1000. ${forme}${vh}${coup}Jockey: ${horse.jockey}.`;
}
