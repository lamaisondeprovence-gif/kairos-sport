import { calculateKairosScore } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const API_KEY = process.env.API_FOOTBALL_KEY;

// Endpoints par sport
const APIS = {
  football: 'https://v3.football.api-sports.io',
  basketball: 'https://v3.basketball.api-sports.io',
  rugby: 'https://v3.rugby.api-sports.io',
  mma: 'https://v3.mma.api-sports.io',
  formula1: 'https://v3.formula-1.api-sports.io',
  hockey: 'https://v3.hockey.api-sports.io',
  baseball: 'https://v3.baseball.api-sports.io',
};

async function fetchAPI(sport, endpoint) {
  const baseUrl = APIS[sport] || APIS.football;
  const host = baseUrl.replace('https://', '');
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': host,
    },
  });
  const data = await res.json();
  return data.response || [];
}

// ── FOOTBALL (données complètes — 7500 req/jour) ──
async function getTeamForm(teamId, leagueId, season) {
  try {
    const data = await fetchAPI('football', `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`);
    if (!data || !data.form) return 50;
    const form = data.form.slice(-5);
    let score = 50;
    for (const r of form) {
      if (r === 'W') score += 10;
      else if (r === 'D') score += 2;
      else if (r === 'L') score -= 8;
    }
    return Math.max(0, Math.min(100, score));
  } catch { return 50; }
}

async function getInjuries(teamId, leagueId, season) {
  try {
    const data = await fetchAPI('football', `/injuries?team=${teamId}&league=${leagueId}&season=${season}`);
    return data.length || 0;
  } catch { return 0; }
}

async function getStandings(teamId, leagueId, season) {
  try {
    const data = await fetchAPI('football', `/standings?league=${leagueId}&season=${season}`);
    if (!data || !data[0]) return { position: 10, points: 0 };
    const standings = data[0]?.league?.standings?.[0] || [];
    const team = standings.find(s => s.team.id === teamId);
    if (!team) return { position: 10, points: 0 };
    return { position: team.rank, points: team.points };
  } catch { return { position: 10, points: 0 }; }
}

async function getH2H(homeId, awayId) {
  try {
    const data = await fetchAPI('football', `/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`);
    if (!data || data.length === 0) return { favorable: false, score: 50 };
    let homeWins = 0;
    for (const match of data) {
      if (match.goals.home > match.goals.away) homeWins++;
    }
    return { favorable: homeWins >= 3, score: (homeWins / data.length) * 100 };
  } catch { return { favorable: false, score: 50 }; }
}

async function getOdds(fixtureId) {
  try {
    const data = await fetchAPI('football', `/odds?fixture=${fixtureId}&bookmaker=8`);
    if (!data || data.length === 0) return { home: 2.0, draw: 3.2, away: 3.5 };
    const bets = data[0]?.bookmakers?.[0]?.bets?.find(b => b.name === 'Match Winner');
    if (!bets) return { home: 2.0, draw: 3.2, away: 3.5 };
    return {
      home: parseFloat(bets.values.find(v => v.value === 'Home')?.odd || 2.0),
      draw: parseFloat(bets.values.find(v => v.value === 'Draw')?.odd || 3.2),
      away: parseFloat(bets.values.find(v => v.value === 'Away')?.odd || 3.5),
    };
  } catch { return { home: 2.0, draw: 3.2, away: 3.5 }; }
}

async function buildFootballEvents() {
  const today = new Date().toISOString().split('T')[0];
  const season = new Date().getFullYear();
  const fixtures = await fetchAPI('football', `/fixtures?date=${today}&status=NS`);
  if (!fixtures || fixtures.length === 0) return [];

  const analyzedEvents = [];
  // Avec 7500 req/jour on peut analyser 50 matchs en profondeur
  const limitedFixtures = fixtures.slice(0, 50);

  for (const fixture of limitedFixtures) {
    try {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const leagueId = fixture.league.id;

      const [formHome, formAway, injuriesHome, injuriesAway, standingsHome, standingsAway, h2h, odds] = await Promise.all([
        getTeamForm(homeId, leagueId, season),
        getTeamForm(awayId, leagueId, season),
        getInjuries(homeId, leagueId, season),
        getInjuries(awayId, leagueId, season),
        getStandings(homeId, leagueId, season),
        getStandings(awayId, leagueId, season),
        getH2H(homeId, awayId),
        getOdds(fixture.fixture.id),
      ]);

      const motivationHome = standingsHome.position <= 6 ? 80 : standingsHome.position <= 12 ? 60 : 40;
      const motivationAway = standingsAway.position <= 6 ? 80 : standingsAway.position <= 12 ? 60 : 40;

      const scoreData = calculateKairosScore({
        formHome, formAway, motivationHome, motivationAway,
        fatigueHome: 30, fatigueAway: 30,
        injuriesHome, injuriesAway,
        h2hFavorable: h2h.favorable, h2hScore: h2h.score,
        weatherOk: true, surfaceFavorable: true,
        oddHome: odds.home, dataCompleteness: 90, smartMoneyHome: 50,
      });

      const bookmakerProb = Math.round(100 / odds.home);
      const valueBet = {
        bookmakerProb,
        kairosProb: scoreData.probability,
        value: scoreData.probability - bookmakerProb,
        isValue: scoreData.probability - bookmakerProb >= 5,
      };

      analyzedEvents.push({
        id: `ft_${fixture.fixture.id}`,
        sport: '⚽',
        sportName: 'Football',
        competition: fixture.league.name,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        startTime: fixture.fixture.date,
        oddHome: odds.home,
        oddDraw: odds.draw,
        oddAway: odds.away,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: scoreData.dataQuality,
        breakdown: scoreData.breakdown,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false, direction: fixture.teams.home.name },
        recommendation: scoreData.recommendation,
        valueBet,
      });
    } catch (err) {
      console.error('Error analyzing fixture:', err);
    }
  }
  return analyzedEvents;
}

// ── AUTRES SPORTS (données basiques — 100 req/jour chacun) ──
async function buildOtherSportsEvents() {
  const today = new Date().toISOString().split('T')[0];
  const events = [];

  // Basketball NBA
  try {
    const games = await fetchAPI('basketball', `/games?date=${today}&league=12`);
    for (const game of (games || []).slice(0, 5)) {
      const scoreData = calculateKairosScore({ formHome: 55, formAway: 45, dataCompleteness: 60, oddHome: 1.9 });
      events.push({
        id: `bk_${game.id}`,
        sport: '🏀', sportName: 'Basketball',
        competition: game.league?.name || 'NBA',
        home: game.teams?.home?.name || 'Home',
        away: game.teams?.away?.name || 'Away',
        startTime: game.date,
        oddHome: 1.90, oddDraw: null, oddAway: 1.90,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: 'Partielle',
        breakdown: scoreData.breakdown,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
        recommendation: scoreData.recommendation,
        valueBet: { bookmakerProb: 53, kairosProb: scoreData.probability, value: scoreData.probability - 53, isValue: scoreData.probability > 58 },
      });
    }
  } catch {}

  // Rugby
  try {
    const games = await fetchAPI('rugby', `/games?date=${today}`);
    for (const game of (games || []).slice(0, 3)) {
      const scoreData = calculateKairosScore({ formHome: 52, formAway: 48, dataCompleteness: 60, oddHome: 2.0 });
      events.push({
        id: `rug_${game.id}`,
        sport: '🏉', sportName: 'Rugby',
        competition: game.league?.name || 'Rugby',
        home: game.teams?.home?.name || 'Home',
        away: game.teams?.away?.name || 'Away',
        startTime: game.date,
        oddHome: 2.0, oddDraw: 12.0, oddAway: 1.80,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: 'Partielle',
        breakdown: scoreData.breakdown,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
        recommendation: scoreData.recommendation,
        valueBet: { bookmakerProb: 50, kairosProb: scoreData.probability, value: scoreData.probability - 50, isValue: scoreData.probability > 55 },
      });
    }
  } catch {}

  // Hockey
  try {
    const games = await fetchAPI('hockey', `/games?date=${today}`);
    for (const game of (games || []).slice(0, 3)) {
      const scoreData = calculateKairosScore({ formHome: 53, formAway: 47, dataCompleteness: 60, oddHome: 1.95 });
      events.push({
        id: `hk_${game.id}`,
        sport: '🏒', sportName: 'Hockey',
        competition: game.league?.name || 'Hockey',
        home: game.teams?.home?.name || 'Home',
        away: game.teams?.away?.name || 'Away',
        startTime: game.date,
        oddHome: 1.95, oddDraw: null, oddAway: 1.85,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: 'Partielle',
        breakdown: scoreData.breakdown,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
        recommendation: scoreData.recommendation,
        valueBet: { bookmakerProb: 51, kairosProb: scoreData.probability, value: scoreData.probability - 51, isValue: scoreData.probability > 56 },
      });
    }
  } catch {}

  return events;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const minScore = parseInt(req.query.minScore) || 80;

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      const { MOCK_EVENTS } = await import('../../lib/mock-data');
      const premium = MOCK_EVENTS.filter(e => e.kairosScore >= minScore);
      return res.status(200).json({
        success: true,
        stats: { totalAnalyzed: MOCK_EVENTS.length, premiumCount: premium.length, ignoredCount: MOCK_EVENTS.length - premium.length },
        events: premium,
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Vérifier le cache Supabase
    const { data: cached } = await supabase
      .from('ks_events')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .limit(1);

    let allEvents = [];

    if (cached && cached.length > 0) {
      // Lire depuis le cache
      const { data: cachedEvents } = await supabase
        .from('ks_events')
        .select('*, ks_scores(*)')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      allEvents = (cachedEvents || []).map(ev => ({
        id: ev.source_id,
        sport: ev.sport === 'Football' ? '⚽' : ev.sport === 'Basketball' ? '🏀' : ev.sport === 'Rugby' ? '🏉' : ev.sport === 'Hockey' ? '🏒' : '⚽',
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
      // Appel API une seule fois par jour
      const [footballEvents, otherEvents] = await Promise.all([
        buildFootballEvents(),
        buildOtherSportsEvents(),
      ]);

      allEvents = [...footballEvents, ...otherEvents];

      // Sauvegarder dans Supabase
      for (const ev of allEvents) {
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
