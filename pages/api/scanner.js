import { calculateKairosScore } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function fetchAPI(endpoint, host) {
  const apiHost = host || 'v3.football.api-sports.io';
  const baseUrl = host ? `https://${host}` : BASE_URL;
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': apiHost,
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
      if (match.goals.home > match.goals.away) homeWins++;
    }
    return { favorable: homeWins >= 3, score: (homeWins / data.length) * 100 };
  } catch { return { favorable: false, score: 50 }; }
}

// Données mock pour les autres sports (Tennis, Basket, Rugby, UFC, F1)
function getMockOtherSports() {
  return [
    {
      id: 'tennis_001',
      sport: '🎾',
      sportName: 'Tennis',
      competition: 'ATP 500',
      home: 'Djokovic',
      away: 'Alcaraz',
      startTime: new Date(Date.now() + 3600000 * 3).toISOString(),
      oddHome: 1.75,
      oddDraw: null,
      oddAway: 2.05,
      kairosScore: 84,
      riskLevel: 'Moyen',
      confidence: 79,
      probability: 68,
      dataQuality: 'Bonne',
      breakdown: [
        { label: 'Forme récente', value: +14, good: true },
        { label: 'Surface favorable', value: +10, good: true },
        { label: 'H2H favorable', value: +8, good: true },
        { label: 'Fatigue', value: -6, good: false },
        { label: 'Pression médiatique', value: -4, good: false },
      ],
      smartMoney: { smallBettorsPct: 55, bigMoneyPct: 65, alert: false, direction: 'Djokovic' },
      recommendation: 'parier',
      valueBet: { bookmakerProb: 57, kairosProb: 68, value: 11, isValue: true },
    },
    {
      id: 'basket_001',
      sport: '🏀',
      sportName: 'Basketball',
      competition: 'NBA',
      home: 'Boston Celtics',
      away: 'Miami Heat',
      startTime: new Date(Date.now() + 3600000 * 5).toISOString(),
      oddHome: 1.60,
      oddDraw: null,
      oddAway: 2.30,
      kairosScore: 88,
      riskLevel: 'Faible',
      confidence: 91,
      probability: 74,
      dataQuality: 'Excellente',
      breakdown: [
        { label: 'Forme récente excellente', value: +18, good: true },
        { label: 'Motivation playoffs', value: +15, good: true },
        { label: 'Blessures adverses', value: +10, good: true },
        { label: 'Smart Money', value: +8, good: true },
        { label: 'Fatigue calendrier', value: -5, good: false },
      ],
      smartMoney: { smallBettorsPct: 48, bigMoneyPct: 72, alert: true, alertMsg: 'Gros argent vers Celtics (72%)', direction: 'Boston Celtics' },
      recommendation: 'parier',
      valueBet: { bookmakerProb: 62, kairosProb: 74, value: 12, isValue: true },
    },
    {
      id: 'rugby_001',
      sport: '🏉',
      sportName: 'Rugby',
      competition: 'Top 14',
      home: 'Stade Toulousain',
      away: 'Racing 92',
      startTime: new Date(Date.now() + 3600000 * 7).toISOString(),
      oddHome: 1.85,
      oddDraw: 11.0,
      oddAway: 1.95,
      kairosScore: 82,
      riskLevel: 'Moyen',
      confidence: 76,
      probability: 69,
      dataQuality: 'Bonne',
      breakdown: [
        { label: 'Forme récente', value: +12, good: true },
        { label: 'Motivation finale', value: +14, good: true },
        { label: 'Avantage domicile', value: +8, good: true },
        { label: 'Blessures (2)', value: -6, good: false },
        { label: 'Données partielles', value: -4, good: false },
      ],
      smartMoney: { smallBettorsPct: 52, bigMoneyPct: 58, alert: false, direction: 'Stade Toulousain' },
      recommendation: 'parier',
      valueBet: { bookmakerProb: 54, kairosProb: 69, value: 15, isValue: true },
    },
    {
      id: 'ufc_001',
      sport: '🥊',
      sportName: 'UFC',
      competition: 'UFC 302',
      home: 'Islam Makhachev',
      away: 'Dustin Poirier',
      startTime: new Date(Date.now() + 3600000 * 10).toISOString(),
      oddHome: 1.35,
      oddDraw: null,
      oddAway: 3.10,
      kairosScore: 86,
      riskLevel: 'Faible',
      confidence: 88,
      probability: 78,
      dataQuality: 'Excellente',
      breakdown: [
        { label: 'Forme récente', value: +16, good: true },
        { label: 'Style favorable', value: +12, good: true },
        { label: 'Motivation titre', value: +14, good: true },
        { label: 'Cote basse (risque)', value: -6, good: false },
        { label: 'Pression médiatique', value: -3, good: false },
      ],
      smartMoney: { smallBettorsPct: 70, bigMoneyPct: 80, alert: false, direction: 'Islam Makhachev' },
      recommendation: 'parier',
      valueBet: { bookmakerProb: 74, kairosProb: 78, value: 4, isValue: false },
    },
    {
      id: 'f1_001',
      sport: '🏎️',
      sportName: 'Formule 1',
      competition: 'Grand Prix Monaco',
      home: 'Max Verstappen',
      away: 'Charles Leclerc',
      startTime: new Date(Date.now() + 3600000 * 24).toISOString(),
      oddHome: 2.10,
      oddDraw: null,
      oddAway: 2.80,
      kairosScore: 81,
      riskLevel: 'Moyen',
      confidence: 74,
      probability: 65,
      dataQuality: 'Bonne',
      breakdown: [
        { label: 'Forme récente', value: +14, good: true },
        { label: 'Circuit favorable', value: +10, good: true },
        { label: 'Qualifications', value: +8, good: true },
        { label: 'Météo incertaine', value: -7, good: false },
        { label: 'Données partielles', value: -5, good: false },
      ],
      smartMoney: { smallBettorsPct: 45, bigMoneyPct: 55, alert: false, direction: 'Max Verstappen' },
      recommendation: 'surveiller',
      valueBet: { bookmakerProb: 48, kairosProb: 65, value: 17, isValue: true },
    },
  ];
}

async function buildEventsFromAPI() {
  const today = new Date().toISOString().split('T')[0];
  const season = new Date().getFullYear();
  const fixtures = await fetchAPI(`/fixtures?date=${today}&status=NS`);
  if (!fixtures || fixtures.length === 0) return getMockOtherSports();

  const analyzedEvents = [];
  const limitedFixtures = fixtures.slice(0, 15);

  for (const fixture of limitedFixtures) {
    try {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const leagueId = fixture.league.id;

      const [formHome, formAway, injuriesHome, injuriesAway, standingsHome, standingsAway, h2h] = await Promise.all([
        getTeamForm(homeId, leagueId, season),
        getTeamForm(awayId, leagueId, season),
        getInjuries(homeId, leagueId, season),
        getInjuries(awayId, leagueId, season),
        getStandings(homeId, leagueId, season),
        getStandings(awayId, leagueId, season),
        getH2H(homeId, awayId),
      ]);

      const motivationHome = standingsHome.position <= 6 ? 80 : standingsHome.position <= 12 ? 60 : 40;
      const motivationAway = standingsAway.position <= 6 ? 80 : standingsAway.position <= 12 ? 60 : 40;

      const scoreData = calculateKairosScore({
        formHome, formAway, motivationHome, motivationAway,
        fatigueHome: 30, fatigueAway: 30,
        injuriesHome, injuriesAway,
        h2hFavorable: h2h.favorable, h2hScore: h2h.score,
        weatherOk: true, surfaceFavorable: true,
        oddHome: 2.0, dataCompleteness: 85, smartMoneyHome: 50,
      });

      const bookmakerProb = Math.round(100 / 2.0);
      const kairosProb = scoreData.probability;
      const valueData = {
        bookmakerProb,
        kairosProb,
        value: kairosProb - bookmakerProb,
        isValue: kairosProb - bookmakerProb >= 5,
      };

      analyzedEvents.push({
        id: `ft_${fixture.fixture.id}`,
        sport: '⚽',
        sportName: 'Football',
        competition: fixture.league.name,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        startTime: fixture.fixture.date,
        oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: scoreData.dataQuality,
        breakdown: scoreData.breakdown,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false, direction: fixture.teams.home.name },
        recommendation: scoreData.recommendation,
        valueBet: valueData,
      });
    } catch (err) {
      console.error('Error analyzing fixture:', err);
    }
  }

  // Ajouter les autres sports
  const otherSports = getMockOtherSports();
  return [...analyzedEvents, ...otherSports];
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const minScore = parseInt(req.query.minScore) || 80;

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      const { MOCK_EVENTS, MOCK_STATS } = await import('../../lib/mock-data');
      const allEvents = [...MOCK_EVENTS, ...getMockOtherSports()];
      const premium = allEvents.filter(e => e.kairosScore >= minScore);
      return res.status(200).json({
        success: true,
        stats: { totalAnalyzed: allEvents.length, premiumCount: premium.length, ignoredCount: allEvents.length - premium.length },
        events: premium,
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: cached } = await supabase
      .from('ks_events')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .limit(1);

    let allEvents = [];

    if (cached && cached.length > 0) {
      const { data: cachedEvents } = await supabase
        .from('ks_events')
        .select('*, ks_scores(*)')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      allEvents = (cachedEvents || []).map(ev => ({
        id: ev.source_id,
        sport: ev.sport === 'Football' ? '⚽' : ev.sport === 'Tennis' ? '🎾' : ev.sport === 'Basketball' ? '🏀' : '⚽',
        sportName: ev.sport,
        competition: ev.competition,
        home: ev.home,
        away: ev.away,
        startTime: ev.start_time,
        oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
        kairosScore: ev.ks_scores?.[0]?.score || 0,
        riskLevel: ev.ks_scores?.[0]?.risk_level || 'Moyen',
        confidence: ev.ks_scores?.[0]?.confidence || 0,
        probability: ev.ks_scores?.[0]?.probability || 0,
        dataQuality: ev.ks_scores?.[0]?.data_quality || 'Bonne',
        breakdown: ev.ks_scores?.[0]?.breakdown || [],
        smartMoney: ev.ks_scores?.[0]?.smart_money || {},
        recommendation: 'parier',
        valueBet: { bookmakerProb: 50, kairosProb: ev.ks_scores?.[0]?.probability || 50, value: (ev.ks_scores?.[0]?.probability || 50) - 50, isValue: (ev.ks_scores?.[0]?.probability || 50) > 55 },
      }));
    } else {
      allEvents = await buildEventsFromAPI();

      for (const ev of allEvents.filter(e => e.sportName === 'Football')) {
        const { data: inserted } = await supabase
          .from('ks_events')
          .insert({ sport: ev.sportName, competition: ev.competition, home: ev.home, away: ev.away, start_time: ev.startTime, source_id: ev.id, status: 'upcoming' })
          .select().single();

        if (inserted) {
          await supabase.from('ks_scores').insert({
            event_id: inserted.id,
            score: ev.kairosScore,
            breakdown: ev.breakdown,
            confidence: ev.confidence,
            data_quality: ev.dataQuality,
            probability: ev.probability,
            risk_level: ev.riskLevel,
            smart_money: ev.smartMoney,
          });
        }
      }
    }

    const premium = allEvents.filter(e => e.kairosScore >= minScore);
    premium.sort((a, b) => b.kairosScore - a.kairosScore);

    return res.status(200).json({
      success: true,
      fromCache: cached && cached.length > 0,
      stats: {
        totalAnalyzed: allEvents.length,
        premiumCount: premium.length,
        ignoredCount: allEvents.length - premium.length,
        lastUpdated: new Date().toISOString(),
      },
      events: premium,
      allEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
          }
            
