import { calculateStake, psychologicalCoach } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const BOOKMAKERS_BE = [
  { name: 'Unibet', url: 'https://www.unibet.be', multiplier: 1.00 },
  { name: 'Circus', url: 'https://www.circus.be', multiplier: 1.02 },
  { name: 'Napoleon', url: 'https://www.napoleon.be', multiplier: 0.98 },
  { name: 'Ladbrokes', url: 'https://www.ladbrokes.be', multiplier: 1.01 },
  { name: 'Betfirst', url: 'https://www.betfirst.be', multiplier: 1.03 },
];

function getBestBookmaker(odd) {
  const odds = BOOKMAKERS_BE.map(b => ({
    ...b,
    odd: parseFloat((odd * b.multiplier).toFixed(2)),
  }));
  odds.sort((a, b) => b.odd - a.odd);
  return odds;
}

function buildTicket(events, budget, mode) {
  let eligible = [...events];
  let maxMatches, minScore;

  if (mode === 'prudent') {
    maxMatches = 3;
    minScore = 85;
    eligible = eligible.filter(e => e.kairosScore >= minScore && !e.trapData?.isTrap);
  } else if (mode === 'equilibre') {
    maxMatches = 5;
    minScore = 80;
    eligible = eligible.filter(e => e.kairosScore >= minScore && !e.trapData?.isTrap);
  } else {
    maxMatches = 8;
    minScore = 75;
    eligible = eligible.filter(e => e.kairosScore >= minScore);
  }

  eligible.sort((a, b) => {
    const scoreA = a.kairosScore + (a.valueBet?.isValue ? 5 : 0);
    const scoreB = b.kairosScore + (b.valueBet?.isValue ? 5 : 0);
    return scoreB - scoreA;
  });

  const selected = eligible.slice(0, maxMatches);
  if (selected.length === 0) return null;

  const totalOdd = selected.reduce((acc, e) => acc * e.oddHome, 1);
  const potentialGain = budget * totalOdd;
  const globalScore = Math.round(selected.reduce((a, e) => a + e.kairosScore, 0) / selected.length);
  const worstMatch = selected.reduce((mn, e) => e.kairosScore < mn.kairosScore ? e : mn, selected[0]);
  const stakeAdvice = calculateStake(budget * 5, globalScore, totalOdd);
  const valueBets = selected.filter(e => e.valueBet?.isValue).length;

  return {
    mode,
    modeLabel: mode === 'prudent' ? 'Prudent' : mode === 'equilibre' ? 'Equilibre' : 'Agressif',
    matches: selected.map(e => {
      const bookmakers = getBestBookmaker(e.oddHome);
      return {
        id: e.id,
        sport: e.sport,
        sportName: e.sportName,
        competition: e.competition,
        home: e.home,
        away: e.away,
        pick: 'Victoire domicile',
        odd: e.oddHome,
        kairosScore: e.kairosScore,
        riskLevel: e.riskLevel,
        confidence: e.confidence,
        valueBet: e.valueBet,
        trapData: e.trapData,
        monteCarlo: e.monteCarlo,
        bestBookmaker: bookmakers[0],
        bookmakers,
        explanation: buildExplanation(e),
      };
    }),
    matchCount: selected.length,
    totalOdd: totalOdd.toFixed(2),
    stake: budget,
    potentialGain: potentialGain.toFixed(0),
    profit: (potentialGain - budget).toFixed(0),
    globalScore,
    globalRisk: mode === 'prudent' ? 'Faible' : mode === 'equilibre' ? 'Moyen' : 'Eleve',
    worstMatch: `${worstMatch.sport} ${worstMatch.home} vs ${worstMatch.away} (score: ${worstMatch.kairosScore})`,
    stakeAdvice,
    valueBetsCount: valueBets,
    bestBookmaker: getBestBookmaker(totalOdd)[0],
  };
}

function buildExplanation(ev) {
  const lines = [];
  if (ev.breakdown) {
    const positives = ev.breakdown.filter(b => b.good).slice(0, 3);
    const negatives = ev.breakdown.filter(b => !b.good).slice(0, 2);
    for (const p of positives) {
      if (p.label.includes('Forme')) lines.push(`${ev.home} est en excellente forme recente`);
      else if (p.label.includes('Motivation')) lines.push(`Forte motivation pour ce match`);
      else if (p.label.includes('Blessures adverses')) lines.push(`L'adversaire a des blesses importants`);
      else if (p.label.includes('Smart Money')) lines.push(`Les gros parieurs misent sur ${ev.home}`);
      else if (p.label.includes('H2H')) lines.push(`Historique favorable contre cet adversaire`);
      else if (p.label.includes('ligue premium')) lines.push(`Donnees tres fiables (ligue majeure)`);
    }
    for (const n of negatives) {
      if (n.label.includes('Blessures propres')) lines.push(`Quelques blesses dans l'equipe`);
      else if (n.label.includes('Fatigue')) lines.push(`leger risque de fatigue`);
    }
  }
  if (ev.valueBet?.isValue) lines.push(`Value bet : IA estime ${ev.valueBet.kairosProb}% vs bookmaker ${ev.valueBet.bookmakerProb}%`);
  if (ev.monteCarlo) lines.push(`Monte Carlo : ${ev.monteCarlo.home}% victoire domicile sur 10 000 simulations`);
  return lines;
}

function buildWorldTop3(events) {
  const sorted = [...events]
    .filter(e => !e.trapData?.isTrap)
    .sort((a, b) => {
      const scoreA = a.kairosScore + (a.valueBet?.isValue ? 10 : 0);
      const scoreB = b.kairosScore + (b.valueBet?.isValue ? 10 : 0);
      return scoreB - scoreA;
    });

  return sorted.slice(0, 3).map((e, i) => ({
    rank: i + 1,
    medal: i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉',
    ...e,
    explanation: buildExplanation(e),
    bookmakers: getBestBookmaker(e.oddHome),
    bestBookmaker: getBestBookmaker(e.oddHome)[0],
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { budget = 100, mode = 'equilibre', minScore = 80, worldMode = false } = req.body;

  try {
    let events = [];
    const today = new Date().toISOString().split('T')[0];

    const { data: cachedEvents } = await supabase
      .from('ks_events')
      .select('*, ks_scores(*)')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (cachedEvents && cachedEvents.length > 0) {
      events = cachedEvents.map(ev => ({
        id: ev.source_id,
        sport: '⚽',
        sportName: ev.sport,
        competition: ev.competition,
        home: ev.home,
        away: ev.away,
        oddHome: 2.0,
        kairosScore: ev.ks_scores?.[0]?.score || 0,
        riskLevel: ev.ks_scores?.[0]?.risk_level || 'Moyen',
        confidence: ev.ks_scores?.[0]?.confidence || 0,
        valueBet: { bookmakerProb: 50, kairosProb: ev.ks_scores?.[0]?.probability || 50, value: 5, isValue: true },
        trapData: { isTrap: false },
        monteCarlo: { home: ev.ks_scores?.[0]?.probability || 50, draw: 25, away: 25 },
        breakdown: ev.ks_scores?.[0]?.breakdown || [],
      }));
    }

    // Si pas d'événements réels → Mode Silence
    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        silence: true,
        message: 'Aucun match disponible pour le moment. Revenez plus tard dans la journée.',
        analyzed: 0,
      });
    }

    if (worldMode) {
      const top3 = buildWorldTop3(events);
      if (top3.length === 0) {
        return res.status(200).json({ success: true, silence: true, message: 'Aucune opportunite Premium mondiale. Conservez votre capital.' });
      }
      return res.status(200).json({ success: true, worldMode: true, top3, analyzed: events.length });
    }

    const prudent = buildTicket(events, budget, 'prudent');
    const equilibre = buildTicket(events, budget, 'equilibre');
    const agressif = buildTicket(events, budget, 'agressif');

    if (!prudent && !equilibre && !agressif) {
      return res.status(200).json({
        success: true,
        silence: true,
        message: 'Aucune opportunite Premium. Conservez votre capital.',
        analyzed: events.length,
      });
    }

    const recommended = mode === 'prudent' ? prudent : mode === 'agressif' ? agressif : equilibre;

    let psychWarnings = null;
    try {
      const { data: bets } = await supabase.from('ks_user_bets').select('*').order('created_at', { ascending: false }).limit(20);
      if (bets) psychWarnings = psychologicalCoach(bets);
    } catch {}

    if (recommended) {
      await supabase.from('ks_user_bets').insert({
        ticket_json: recommended,
        stake: budget,
        potential_gain: parseFloat(recommended.potentialGain),
        total_odd: parseFloat(recommended.totalOdd),
        result: 'pending',
      });
    }

    return res.status(200).json({
      success: true,
      ticket: recommended,
      tickets: { prudent, equilibre, agressif },
      psychWarnings,
    });

  } catch (err) {
    console.error('Generate ticket error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
