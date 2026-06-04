import { calculateStake } from '../../lib/kairos-score';
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
    eligible = eligible.filter(e => e.kairosScore >= minScore);
  } else if (mode === 'equilibre') {
    maxMatches = 5;
    minScore = 80;
    eligible = eligible.filter(e => e.kairosScore >= minScore);
  } else {
    maxMatches = 8;
    minScore = 75;
    eligible = eligible.filter(e => e.kairosScore >= minScore);
  }

  eligible.sort((a, b) => b.kairosScore - a.kairosScore);
  const selected = eligible.slice(0, maxMatches);

  if (selected.length === 0) return null;

  const totalOdd = selected.reduce((acc, e) => acc * e.oddHome, 1);
  const potentialGain = budget * totalOdd;
  const globalScore = Math.round(selected.reduce((a, e) => a + e.kairosScore, 0) / selected.length);
  const worstMatch = selected.reduce((mn, e) => e.kairosScore < mn.kairosScore ? e : mn, selected[0]);
  const stakeAdvice = calculateStake(budget * 5, globalScore, totalOdd);

  return {
    mode,
    modeLabel: mode === 'prudent' ? '🛡️ Prudent' : mode === 'equilibre' ? '⚖️ Équilibré' : '🔥 Agressif',
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
        bestBookmaker: bookmakers[0],
        bookmakers: bookmakers,
      };
    }),
    matchCount: selected.length,
    totalOdd: totalOdd.toFixed(2),
    stake: budget,
    potentialGain: potentialGain.toFixed(0),
    profit: (potentialGain - budget).toFixed(0),
    globalScore,
    globalRisk: mode === 'prudent' ? 'Faible' : mode === 'equilibre' ? 'Moyen' : 'Élevé',
    worstMatch: `${worstMatch.sport} ${worstMatch.home} vs ${worstMatch.away} (score: ${worstMatch.kairosScore})`,
    stakeAdvice,
    analyzed: events.length,
    bestBookmaker: getBestBookmaker(totalOdd)[0],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { budget = 100, mode = 'equilibre', minScore = 80 } = req.body;

  try {
    // Récupérer les événements depuis le cache Supabase ou mock
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
        sport: ev.sport === 'Football' ? '⚽' : ev.sport === 'Tennis' ? '🎾' : ev.sport === 'Basketball' ? '🏀' : '⚽',
        sportName: ev.sport,
        competition: ev.competition,
        home: ev.home,
        away: ev.away,
        oddHome: 2.0,
        kairosScore: ev.ks_scores?.[0]?.score || 0,
        riskLevel: ev.ks_scores?.[0]?.risk_level || 'Moyen',
        confidence: ev.ks_scores?.[0]?.confidence || 0,
        valueBet: { bookmakerProb: 50, kairosProb: ev.ks_scores?.[0]?.probability || 50, value: 5, isValue: true },
      }));
    } else {
      const { MOCK_EVENTS } = await import('../../lib/mock-data');
      const { getMockOtherSports } = await import('./scanner');
      events = [...MOCK_EVENTS];
    }

    // Générer les 3 modes de ticket
    const prudent = buildTicket(events, budget, 'prudent');
    const equilibre = buildTicket(events, budget, 'equilibre');
    const agressif = buildTicket(events, budget, 'agressif');

    // Si aucun ticket possible
    if (!prudent && !equilibre && !agressif) {
      return res.status(200).json({
        success: true,
        silence: true,
        message: 'Aucune opportunité Premium disponible. Recommandation : conserver votre capital.',
        analyzed: events.length,
      });
    }

    // Ticket recommandé selon le mode demandé
    const recommended = mode === 'prudent' ? prudent : mode === 'agressif' ? agressif : equilibre;

    // Sauvegarder dans Supabase
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
      tickets: {
        prudent: prudent || null,
        equilibre: equilibre || null,
        agressif: agressif || null,
      },
    });

  } catch (err) {
    console.error('Generate ticket error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
