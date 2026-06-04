import { MOCK_EVENTS, MOCK_STATS } from '../../lib/mock-data';
import { calculateKairosScore } from '../../lib/kairos-score';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const minScore = parseInt(req.query.minScore) || 80;

  try {
    let events = [];

    if (process.env.API_FOOTBALL_KEY && process.env.API_FOOTBALL_KEY !== 'TA_CLE_API_FOOTBALL') {
      events = await fetchLiveFootballEvents();
    } else {
      events = MOCK_EVENTS;
    }

    const premium = events.filter(e => e.kairosScore >= minScore);

    return res.status(200).json({
      success: true,
      stats: {
        ...MOCK_STATS,
        premiumCount: premium.length,
        ignoredCount: events.length - premium.length,
      },
      events: premium,
      allEvents: events,
    });
  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function fetchLiveFootballEvents() {
  const today = new Date().toISOString().split('T')[0];
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}&status=NS`,
    {
      headers: {
        'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    }
  );
  const data = await res.json();
  if (!data.response) return [];

  return data.response.slice(0, 50).map(fixture => {
    const scoreData = calculateKairosScore({
      formHome: Math.random() * 60 + 20,
      formAway: Math.random() * 60 + 20,
      motivationHome: Math.random() * 60 + 20,
      motivationAway: Math.random() * 60 + 20,
      fatigueHome: Math.random() * 40,
      fatigueAway: Math.random() * 40,
      injuriesHome: Math.floor(Math.random() * 3),
      injuriesAway: Math.floor(Math.random() * 3),
      h2hFavorable: Math.random() > 0.5,
      h2hScore: Math.random() * 60 + 20,
      dataCompleteness: 85,
      oddHome: 1.8 + Math.random(),
    });

    return {
      id: `ft_${fixture.fixture.id}`,
      sport: '⚽',
      sportName: 'Football',
      competition: fixture.league.name,
      home: fixture.teams.home.name,
      away: fixture.teams.away.name,
      startTime: fixture.fixture.date,
      oddHome: 2.0,
      oddDraw: 3.2,
      oddAway: 3.5,
      kairosScore: scoreData.score,
      riskLevel: scoreData.riskLevel,
      confidence: scoreData.confidence,
      probability: scoreData.probability,
      dataQuality: scoreData.dataQuality,
      breakdown: scoreData.breakdown,
      smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
      recommendation: scoreData.recommendation,
    };
  });
}
