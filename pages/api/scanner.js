import { calculateKairosScore, monteCarloSimulation } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const ALL_LEAGUES = {
  39: { name: 'Premier League', country: 'EN', tier: 1 },
  135: { name: 'Serie A', country: 'IT', tier: 1 },
  140: { name: 'La Liga', country: 'ES', tier: 1 },
  78: { name: 'Bundesliga', country: 'DE', tier: 1 },
  61: { name: 'Ligue 1', country: 'FR', tier: 1 },
  94: { name: 'Liga Portugal', country: 'PT', tier: 1 },
  144: { name: 'Pro League', country: 'BE', tier: 1 },
  88: { name: 'Eredivisie', country: 'NL', tier: 1 },
  40: { name: 'Championship', country: 'EN', tier: 2 },
  136: { name: 'Serie B', country: 'IT', tier: 2 },
  141: { name: 'Segunda Division', country: 'ES', tier: 2 },
  79: { name: 'Bundesliga 2', country: 'DE', tier: 2 },
  62: { name: 'Ligue 2', country: 'FR', tier: 2 },
  113: { name: 'Allsvenskan', country: 'SE', tier: 2 },
  103: { name: 'Eliteserien', country: 'NO', tier: 2 },
  119: { name: 'Superliga', country: 'DK', tier: 2 },
  2: { name: 'Champions League', country: 'EU', tier: 1 },
  3: { name: 'Europa League', country: 'EU', tier: 1 },
  848: { name: 'Conference League', country: 'EU', tier: 2 },
  253: { name: 'MLS', country: 'US', tier: 2 },
  71: { name: 'Serie A Bresil', country: 'BR', tier: 2 },
  128: { name: 'Liga Profesional', country: 'AR', tier: 2 },
  262: { name: 'Liga MX', country: 'MX', tier: 2 },
  239: { name: 'Primera Division', country: 'CL', tier: 2 },
  98: { name: 'J-League', country: 'JP', tier: 2 },
  292: { name: 'K-League', country: 'KR', tier: 2 },
  169: { name: 'Chinese Super League', country: 'CN', tier: 2 },
  200: { name: 'Premier Soccer League', country: 'ZA', tier: 2 },
  1: { name: 'World Cup', country: 'WC', tier: 1 },
  4: { name: 'Euro Championship', country: 'EU', tier: 1 },
  6: { name: 'Africa Cup', country: 'AF', tier: 1 },
  9: { name: 'Copa America', country: 'AM', tier: 1 },
};

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

async function getOdds(fixtureId) {
  try {
    const data = await fetchAPI(`/odds?fixture=${fixtureId}&bookmaker=8`);
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
  const allFixtures = [];

  for (const [leagueId, leagueInfo] of Object.entries(ALL_LEAGUES)) {
    try {
      const fixtures = await fetchAPI(`/fixtures?date=${today}&league=${leagueId}&status=NS`);
      for (const f of fixtures) {
        allFixtures.push({ ...f, leagueInfo, leagueId: parseInt(leagueId) });
      }
    } catch {}
  }

  if (allFixtures.length === 0) return [];

  allFixtures.sort((a, b) => a.leagueInfo.tier - b.leagueInfo.tier);
  const limitedFixtures = allFixtures.slice(0, 50);
  const analyzedEvents = [];

  for (const fixture of limitedFixtures) {
    try {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const leagueId = fixture.leagueId;
      const isTopLeague = fixture.leagueInfo.tier === 1;

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

      const eventData = {
        formHome, formAway, motivationHome, motivationAway,
        fatigueHome: 30, fatigueAway: 30,
        injuriesHome, injuriesAway,
        h2hFavorable: h2h.favorable, h2hScore: h2h.score,
        weatherOk: true, surfaceFavorable: true,
        oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
        dataCompleteness: isTopLeague ? 92 : 75,
        smartMoneyHome: 50, isTopLeague,
      };

      const scoreData = calculateKairosScore(eventData);
      const monte = monteCarloSimulation(eventData);
      const bookmakerProb = Math.round(100 / odds.home);

      analyzedEvents.push({
        id: `ft_${fixture.fixture.id}`,
        sport: '⚽',
        sportName: 'Football',
        competition: `${fixture.leagueInfo.country} ${fixture.leagueInfo.name}`,
        leagueTier: fixture.leagueInfo.tier,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        startTime: fixture.fixture.date,
        oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
        kairosScore: scoreData.score,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: scoreData.dataQuality,
        breakdown: scoreData.breakdown,
        trapData: scoreData.trapData,
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false, direction: fixture.teams.home.name },
        recommendation: scoreData.recommendation,
        valueBet: {
          bookmakerProb,
          kairosProb: scoreData.probability,
          value: monte.home - bookmakerProb,
          isValue: monte.home - bookmakerProb >= 5,
          monteCarlo: monte,
        },
        monteCarlo: monte,
        isTopLeague,
      });
    } catch (err) {
      console.error('Error analyzing fixture:', err);
    }
  }

  return analyzedEvents;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const minScore = parseInt(req.query.minScore) || 80;

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [],
      });
    }

    // Cache de 1 heure — rafraîchissement automatique
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: cached } = await supabase
      .from('ks_events')
      .select('*')
      .gte('created_at', oneHourAgo)
      .limit(1);

    let allEvents = [];

    if (cached && cached.length > 0) {
      // Cache valide — lire depuis Supabase
      const { data: cachedEvents } = await supabase
        .from('ks_events')
        .select('*, ks_scores(*)')
        .gte('created_at', oneHourAgo);

      allEvents = (cachedEvents || []).map(ev => ({
        id: ev.source_id, sport: '⚽', sportName: ev.sport,
        competition: ev.competition, home: ev.home, away: ev.away,
        startTime: ev.start_time, oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
        kairosScore: ev.ks_scores?.[0]?.score || 0,
        riskLevel: ev.ks_scores?.[0]?.risk_level || 'Moyen',
        confidence: ev.ks_scores?.[0]?.confidence || 0,
        probability: ev.ks_scores?.[0]?.probability || 0,
        dataQuality: ev.ks_scores?.[0]?.data_quality || 'Bonne',
        breakdown: ev.ks_scores?.[0]?.breakdown || [],
        trapData: { isTrap: false, label: 'Valeur reelle detectee', color: '#00FFB2' },
        smartMoney: ev.ks_scores?.[0]?.smart_money || {},
        recommendation: 'parier',
        valueBet: { bookmakerProb: 50, kairosProb: ev.ks_scores?.[0]?.probability || 50, value: 5, isValue: true },
        monteCarlo: { home: ev.ks_scores?.[0]?.probability || 50, draw: 25, away: 25 },
      }));
    } else {
      // Cache expiré ou vide — appeler l'API
      // Nettoyer les anciennes données
      await supabase.from('ks_scores').delete().lt('created_at', oneHourAgo);
      await supabase.from('ks_events').delete().lt('created_at', oneHourAgo);

      allEvents = await buildFootballEvents();

      if (allEvents.length === 0) {
        return res.status(200).json({
          success: true, silence: true,
          stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
          events: [],
          message: 'Aucun match disponible pour le moment. Revenez dans quelques heures.',
        });
      }

      for (const ev of allEvents) {
        const { data: inserted } = await supabase
          .from('ks_events')
          .insert({ sport: ev.sportName, competition: ev.competition, home: ev.home, away: ev.away, start_time: ev.startTime, source_id: ev.id, status: 'upcoming' })
          .select().single();
        if (inserted) {
          await supabase.from('ks_scores').insert({
            event_id: inserted.id, score: ev.kairosScore,
            breakdown: ev.breakdown, confidence: ev.confidence,
            data_quality: ev.dataQuality, probability: ev.probability,
            risk_level: ev.riskLevel, smart_money: ev.smartMoney,
          });
        }
      }
    }

    const premium = allEvents.filter(e => e.kairosScore >= minScore);
    premium.sort((a, b) => b.kairosScore - a.kairosScore);

    if (premium.length === 0) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: allEvents.length, premiumCount: 0, ignoredCount: allEvents.length },
        events: [],
        message: `${allEvents.length} matchs analyses — aucun ne depasse le seuil de ${minScore}.`,
      });
    }

    return res.status(200).json({
      success: true,
      fromCache: cached && cached.length > 0,
      stats: {
        totalAnalyzed: allEvents.length,
        premiumCount: premium.length,
        ignoredCount: allEvents.length - premium.length,
        lastUpdated: new Date().toISOString(),
        leaguesCount: Object.keys(ALL_LEAGUES).length,
      },
      events: premium,
      allEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
