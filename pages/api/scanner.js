import { calculateKairosScore } from '../../lib/kairos-score';

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function fetchAPI(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
  });
  const data = await res.json();
  return data.response || [];
}

async function getTeamForm(teamId, leagueId, season) {
  try {
    const data = await fetchAPI(`/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`);
    if (!data || !data.form) return 50;
    const form = data.form.slice(-5);
    let score = 50;
    for (const result of form) {
      if (result === 'W') score += 10;
      else if (result === 'D') score += 2;
      else if (result === 'L') score -= 8;
    }
    return Math.max(0, Math.min(100, score));
  } catch { return 50; }
}

async function getInjuries(teamId, leagueId, season) {
  try {
    const data = await fetchAPI(`/injuries?team=${teamId}&league=${leagueId}&season=${season}`);
    return data.length || 0;
  } catch { return 0; }
}

async function getStandings(teamId, leagueId, season) {
  try {
    const data = await fetchAPI(`/standings?league=${leagueId}&season=${season}`);
    if (!data || !data[0]) return { position: 10, points: 0 };
    const standings = data[0]?.league?.standings?.[0] || [];
    const team = standings.find(s => s.team.id === teamId);
    if (!team) return { position: 10, points: 0 };
    return { position: team.rank, points: team.points };
  } catch { return { position: 10, points: 0 }; }
}

async function getH2H(homeId, awayId) {
  try {
    const data = await fetchAPI(`/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`);
    if (!data || data.length === 0) return { favorable: false, score: 50 };
    let homeWins = 0;
    for (const match of data) {
      const homeGoals = match.goals.home;
      const awayGoals = match.goals.away;
      if (homeGoals > awayGoals) homeWins++;
    }
    const h2hScore = (homeWins / data.length) * 100;
    return { favorable: homeWins >= 3, score: h2hScore };
  } catch { return { favorable: false, score: 50 }; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const minScore = parseInt(req.query.minScore) || 80;

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      const { MOCK_EVENTS, MOCK_STATS } = await import('../../lib/mock-data');
      const premium = MOCK_EVENTS.filter(e => e.kairosScore >= minScore);
      return res.status(200).json({
        success: true,
        stats: { ...MOCK_STATS, premiumCount: premium.length, ignoredCount: MOCK_EVENTS.length - premium.length },
        events: premium,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const season = new Date().getFullYear();
    const fixtures = await fetchAPI(`/fixtures?date=${today}&status=NS`);

    if (!fixtures || fixtures.length === 0) {
      return res.status(200).json({
        success: true,
        silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [],
      });
    }

    const analyzedEvents = [];

    // Limiter à 20 matchs pour ne pas dépasser les 100 requêtes/jour
    const limitedFixtures = fixtures.slice(0, 20);

    for (const fixture of limitedFixtures) {
      try {
        const homeId = fixture.teams.home.id;
        const awayId = fixture.teams.away.id;
        const leagueId = fixture.league.id;

        // Récupérer les données réelles en parallèle
        const [formHome, formAway, injuriesHome, injuriesAway, standingsHome, standingsAway, h2h] = await Promise.all([
          getTeamForm(homeId, leagueId, season),
          getTeamForm(awayId, leagueId, season),
          getInjuries(homeId, leagueId, season),
          getInjuries(awayId, leagueId, season),
          getStandings(homeId, leagueId, season),
          getStandings(awayId, leagueId, season),
          getH2H(homeId, awayId),
        ]);

        // Motivation basée sur le classement
        const motivationHome = standingsHome.position <= 6 ? 80 : standingsHome.position <= 12 ? 60 : 40;
        const motivationAway = standingsAway.position <= 6 ? 80 : standingsAway.position <= 12 ? 60 : 40;

        // Calcul du Kairos Score avec vraies données
        const scoreData = calculateKairosScore({
          formHome,
          formAway,
          motivationHome,
          motivationAway,
          fatigueHome: 30,
          fatigueAway: 30,
          injuriesHome,
          injuriesAway,
          h2hFavorable: h2h.favorable,
          h2hScore: h2h.score,
          weatherOk: true,
          surfaceFavorable: true,
          oddHome: fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[0]?.odd || 2.0,
          dataCompleteness: 85,
          smartMoneyHome: 50,
        });

        analyzedEvents.push({
          id: `ft_${fixture.fixture.id}`,
          sport: '⚽',
          sportName: 'Football',
          competition: fixture.league.name,
          home: fixture.teams.home.name,
          away: fixture.teams.away.name,
          startTime: fixture.fixture.date,
          oddHome: parseFloat(fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[0]?.odd || 2.0),
          oddDraw: parseFloat(fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[1]?.odd || 3.2),
          oddAway: parseFloat(fixture.odds?.[0]?.bookmakers?.[0]?.bets?.[0]?.values?.[2]?.odd || 3.5),
          kairosScore: scoreData.score,
          riskLevel: scoreData.riskLevel,
          confidence: scoreData.confidence,
          probability: scoreData.probability,
          dataQuality: scoreData.dataQuality,
          breakdown: scoreData.breakdown,
          smartMoney: {
            smallBettorsPct: 50,
            bigMoneyPct: 50,
            alert: false,
            direction: fixture.teams.home.name,
          },
          recommendation: scoreData.recommendation,
          realData: {
            formHome,
            formAway,
            injuriesHome,
            injuriesAway,
            standingsHome,
            standingsAway,
          },
        });
      } catch (err) {
        console.error('Error analyzing fixture:', err);
      }
    }

    const premium = analyzedEvents.filter(e => e.kairosScore >= minScore);
    premium.sort((a, b) => b.kairosScore - a.kairosScore);

    return res.status(200).json({
      success: true,
      stats: {
        totalAnalyzed: fixtures.length,
        premiumCount: premium.length,
        ignoredCount: analyzedEvents.length - premium.length,
        lastUpdated: new Date().toISOString(),
      },
      events: premium,
      allEvents: analyzedEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
          }
            
