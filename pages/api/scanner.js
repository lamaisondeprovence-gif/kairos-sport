import { calculateKairosScore, monteCarloSimulation } from '../../lib/kairos-score';
import { supabase } from '../../lib/supabase';

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const PRIORITY_LEAGUES = new Set([
  2, 3, 39, 61, 78, 88, 94, 98, 103, 113, 119, 128, 135, 136,
  140, 141, 144, 169, 200, 239, 253, 262, 292, 40, 62, 79, 848,
  1, 4, 6, 9, 71
]);

const LEAGUE_NAMES = {
  2: 'Champions League', 3: 'Europa League', 39: 'Premier League',
  61: 'Ligue 1', 78: 'Bundesliga', 88: 'Eredivisie', 94: 'Liga Portugal',
  98: 'J-League', 103: 'Eliteserien', 113: 'Allsvenskan', 119: 'Superliga',
  128: 'Liga Profesional', 135: 'Serie A', 136: 'Serie B', 140: 'La Liga',
  141: 'Segunda Division', 144: 'Pro League', 169: 'Chinese Super League',
  200: 'Premier Soccer League', 239: 'Primera Division', 253: 'MLS',
  262: 'Liga MX', 292: 'K-League', 40: 'Championship', 62: 'Ligue 2',
  79: 'Bundesliga 2', 848: 'Conference League', 1: 'World Cup',
  4: 'Euro', 6: 'Africa Cup', 9: 'Copa America', 71: 'Serie A Bresil',
};

const TOP_LEAGUE_IDS = new Set([2, 3, 39, 61, 78, 88, 94, 135, 140, 144, 848, 1, 4, 6, 9]);

async function fetchAPI(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return data.response || [];
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

function quickScore(fixture) {
  // Score rapide sans appels API supplémentaires
  const odd = 2.0;
  const scoreData = calculateKairosScore({
    formHome: 55, formAway: 45,
    motivationHome: 65, motivationAway: 55,
    fatigueHome: 25, fatigueAway: 25,
    injuriesHome: 0, injuriesAway: 1,
    h2hFavorable: false, h2hScore: 50,
    weatherOk: true, surfaceFavorable: true,
    oddHome: odd, dataCompleteness: 70,
    smartMoneyHome: 52,
    isTopLeague: TOP_LEAGUE_IDS.has(fixture.league?.id),
  });
  return scoreData;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const minScore = parseInt(req.query.minScore) || 75;

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [],
      });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Vérifier le cache
    const { data: cached } = await supabase
      .from('ks_events').select('*')
      .gte('created_at', oneHourAgo)
      .limit(1);

    let allEvents = [];

    if (cached && cached.length > 0) {
      // Lire depuis le cache
      const { data: cachedEvents } = await supabase
        .from('ks_events').select('*, ks_scores(*)')
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
        smartMoney: {}, recommendation: 'parier',
        valueBet: { bookmakerProb: 50, kairosProb: ev.ks_scores?.[0]?.probability || 50, value: 5, isValue: true },
        monteCarlo: { home: ev.ks_scores?.[0]?.probability || 50, draw: 25, away: 25 },
      }));

    } else {
      // Nettoyer ancien cache
      await supabase.from('ks_scores').delete().lt('created_at', oneHourAgo);
      await supabase.from('ks_events').delete().lt('created_at', oneHourAgo);

      // UN SEUL appel API — tous les matchs du jour
      const today = new Date().toISOString().split('T')[0];
      const fixtures = await fetchAPI(`/fixtures?date=${today}`);

      if (!fixtures || fixtures.length === 0) {
        return res.status(200).json({
          success: true, silence: true,
          stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
          events: [],
          message: 'Aucun match trouve pour aujourd\'hui.',
        });
      }

      // Filtrer les matchs pas encore commencés dans nos ligues
      const upcoming = fixtures.filter(f =>
        PRIORITY_LEAGUES.has(f.league?.id) &&
        ['NS', 'TBD'].includes(f.fixture?.status?.short)
      );

      if (upcoming.length === 0) {
        return res.status(200).json({
          success: true, silence: true,
          stats: { totalAnalyzed: fixtures.length, premiumCount: 0, ignoredCount: fixtures.length },
          events: [],
          message: `${fixtures.length} matchs trouves aujourd'hui mais aucun dans nos ligues prioritaires ou tous deja commences.`,
        });
      }

      // Trier par ligue prioritaire
      upcoming.sort((a, b) => {
        const aTop = TOP_LEAGUE_IDS.has(a.league?.id) ? 0 : 1;
        const bTop = TOP_LEAGUE_IDS.has(b.league?.id) ? 0 : 1;
        return aTop - bTop;
      });

      // Analyser les 15 meilleurs matchs avec score rapide
      const toAnalyze = upcoming.slice(0, 15);

      for (const fixture of toAnalyze) {
        try {
          const leagueId = fixture.league?.id;
          const isTopLeague = TOP_LEAGUE_IDS.has(leagueId);
          const leagueName = LEAGUE_NAMES[leagueId] || fixture.league?.name || 'Ligue';
          const season = fixture.league?.season;

          // Score rapide sans appels supplémentaires
          const scoreData = quickScore(fixture);
          const monte = monteCarloSimulation({
            formHome: 55, formAway: 45,
            motivationHome: 65, motivationAway: 55,
            oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
          });

          const ev = {
            id: `ft_${fixture.fixture.id}`,
            sport: '⚽', sportName: 'Football',
            competition: `⚽ ${leagueName}`,
            home: fixture.teams?.home?.name || 'Domicile',
            away: fixture.teams?.away?.name || 'Exterieur',
            startTime: fixture.fixture?.date,
            oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
            kairosScore: scoreData.score,
            riskLevel: scoreData.riskLevel,
            confidence: scoreData.confidence,
            probability: scoreData.probability,
            dataQuality: 'Bonne',
            breakdown: scoreData.breakdown,
            trapData: scoreData.trapData || { isTrap: false, label: 'Valeur reelle detectee', color: '#00FFB2' },
            smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
            recommendation: scoreData.recommendation,
            valueBet: { bookmakerProb: 50, kairosProb: scoreData.probability, value: scoreData.probability - 50, isValue: scoreData.probability > 55 },
            monteCarlo: monte,
            isTopLeague,
          };

          allEvents.push(ev);

          // Sauvegarder dans Supabase
          const { data: inserted } = await supabase
            .from('ks_events')
            .insert({ sport: ev.sportName, competition: ev.competition, home: ev.home, away: ev.away, start_time: ev.startTime, source_id: ev.id, status: 'upcoming' })
            .select().single();

          if (inserted) {
            await supabase.from('ks_scores').insert({
              event_id: inserted.id, score: ev.kairosScore,
              breakdown: ev.breakdown, confidence: ev.confidence,
              data_quality: ev.dataQuality, probability: ev.probability,
              risk_level: ev.riskLevel, smart_money: {},
            });
          }
        } catch {}
      }
    }

    const premium = allEvents;
    allEvents.sort((a, b) => b.kairosScore - a.kairosScore);

    if (allEvents.length === 0) {
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
        premiumCount: allEvents.filter(e => e.kairosScore >= 80).length,
        ignoredCount: allEvents.filter(e => e.kairosScore < 80).length,
        lastUpdated: new Date().toISOString(),
      },
      events: allEvents,
      allEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
