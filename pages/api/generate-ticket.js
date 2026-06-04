import { MOCK_EVENTS } from '../../lib/mock-data';
import { calculateStake } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    budget = 100,
    riskLevel = 'Faible',
    sport = 'Tous',
    minScore = 80,
  } = req.body;

  try {
    let events = MOCK_EVENTS;

    const filtered = sport === 'Tous'
      ? events
      : events.filter(e => e.sportName === sport);

    let eligible = filtered.filter(e => e.kairosScore >= minScore);

    if (riskLevel === 'Faible') {
      eligible = eligible.filter(e => e.kairosScore >= 85);
    } else if (riskLevel === 'Moyen') {
      eligible = eligible.filter(e => e.kairosScore >= 75);
    }

    eligible.sort((a, b) => b.kairosScore - a.kairosScore);

    const maxMatches = riskLevel === 'Faible' ? 4 : riskLevel === 'Moyen' ? 6 : 8;
    const selected = eligible.slice(0, maxMatches);

    if (selected.length === 0) {
      return res.status(200).json({
        success: true,
        silence: true,
        message: 'Aucune opportunité Premium disponible. Recommandation : conserver votre capital.',
        analyzed: MOCK_EVENTS.length,
      });
    }

    const totalOdd = selected.reduce((acc, e) => acc * e.oddHome, 1);
    const potentialGain = budget * totalOdd;
    const profit = potentialGain - budget;
    const globalScore = Math.round(
      selected.reduce((a, e) => a + e.kairosScore, 0) / selected.length
    );

    const worstMatch = selected.reduce(
      (min, e) => (e.kairosScore < min.kairosScore ? e : min),
      selected[0]
    );

    const stakeAdvice = calculateStake(budget * 5, globalScore, totalOdd);

    const ticket = {
      matches: selected.map(e => ({
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
      })),
      matchCount: selected.length,
      totalOdd: totalOdd.toFixed(2),
      stake: budget,
      potentialGain: potentialGain.toFixed(0),
      profit: profit.toFixed(0),
      globalScore,
      globalRisk: riskLevel,
      worstMatch: `${worstMatch.sport} ${worstMatch.home} vs ${worstMatch.away} (score: ${worstMatch.kairosScore})`,
      stakeAdvice,
      analyzed: MOCK_EVENTS.length,
    };

    await supabase.from('ks_user_bets').insert({
      ticket_json: ticket,
      stake: budget,
      potential_gain: parseFloat(potentialGain.toFixed(0)),
      total_odd: parseFloat(totalOdd.toFixed(2)),
      result: 'pending',
    });

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    console.error('Generate ticket error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
