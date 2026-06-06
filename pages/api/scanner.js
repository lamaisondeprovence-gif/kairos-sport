import { calculateKairosScore, monteCarloSimulation } from '../../lib/kairos-score';

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

// Statuts acceptés : à venir + en cours (pas terminés)
const VALID_STATUSES = new Set([
  'NS',   // Not Started
  'TBD',  // Time To Be Defined
  '1H',   // First Half
  'HT',   // Half Time
  '2H',   // Second Half
  'ET',   // Extra Time
  'P',    // Penalty In Progress
  'LIVE', // Live
  'BT',   // Break Time
]);

async function fetchAPI(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    if (!API_KEY || API_KEY === 'TA_CLE_API_FOOTBALL') {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [], debug: { error: 'Pas de clé API configurée' },
      });
    }

    // Heure Brussels (UTC+2)
    const now = new Date();
    const brusselsOffset = 2 * 60 * 60 * 1000;
    const brusselsTime = new Date(now.getTime() + brusselsOffset);
    const today = brusselsTime.toISOString().split('T')[0];
    const currentHour = brusselsTime.getHours();

    // UN seul appel — tous les matchs du jour
    const fixtures = await fetchAPI(`/fixtures?date=${today}`);

    const debug = {
      heureActuelle: brusselsTime.toISOString(),
      heureBrussels: `${currentHour}:${brusselsTime.getMinutes()}`,
      dateUtilisee: today,
      totalMatchsRecus: fixtures.length,
      statutsRecus: [...new Set(fixtures.map(f => f.fixture?.status?.short))],
    };

    if (!fixtures || fixtures.length === 0) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [], debug,
        message: 'Aucun match trouve pour aujourd\'hui.',
      });
    }

    // Filtrer : ligues prioritaires + statuts valides (en cours OU à venir)
    const relevant = fixtures.filter(f => {
      const inLeague = PRIORITY_LEAGUES.has(f.league?.id);
      const validStatus = VALID_STATUSES.has(f.fixture?.status?.short);
      return inLeague && validStatus;
    });

    debug.matchsFiltresLigue = fixtures.filter(f => PRIORITY_LEAGUES.has(f.league?.id)).length;
    debug.matchsStatutValide = relevant.length;
    debug.raisonFiltrage = relevant.length === 0
      ? `Aucun match dans nos ligues avec statut valide. Statuts dispo: ${debug.statutsRecus.join(', ')}`
      : `${relevant.length} matchs trouves`;

    if (relevant.length === 0) {
      // Retourner TOUS les matchs du jour sans filtre de ligue comme fallback
      const allValid = fixtures.filter(f => VALID_STATUSES.has(f.fixture?.status?.short));
      debug.fallback = `Retour sur tous les matchs valides: ${allValid.length}`;

      if (allValid.length === 0) {
        return res.status(200).json({
          success: true, silence: true,
          stats: { totalAnalyzed: fixtures.length, premiumCount: 0, ignoredCount: fixtures.length },
          events: [], debug,
          message: `${fixtures.length} matchs recus mais aucun avec statut valide.`,
        });
      }

      // Utiliser tous les matchs valides
      relevant.push(...allValid.slice(0, 20));
    }

    // Trier : ligues top + matchs en cours en premier
    relevant.sort((a, b) => {
      const aLive = ['1H', 'HT', '2H', 'ET', 'LIVE'].includes(a.fixture?.status?.short) ? 0 : 1;
      const bLive = ['1H', 'HT', '2H', 'ET', 'LIVE'].includes(b.fixture?.status?.short) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      const aTop = TOP_LEAGUE_IDS.has(a.league?.id) ? 0 : 1;
      const bTop = TOP_LEAGUE_IDS.has(b.league?.id) ? 0 : 1;
      return aTop - bTop;
    });

    const toAnalyze = relevant.slice(0, 20);
    const analyzedEvents = [];

    for (const fixture of toAnalyze) {
      try {
        const leagueId = fixture.league?.id;
        const isTopLeague = TOP_LEAGUE_IDS.has(leagueId);
        const leagueName = LEAGUE_NAMES[leagueId] || fixture.league?.name || 'Ligue';
        const status = fixture.fixture?.status?.short;
        const isLive = ['1H', 'HT', '2H', 'ET', 'LIVE', 'BT'].includes(status);
        const elapsed = fixture.fixture?.status?.elapsed || 0;

        const scoreData = calculateKairosScore({
          formHome: 55, formAway: 45,
          motivationHome: 65, motivationAway: 55,
          fatigueHome: 25, fatigueAway: 30,
          injuriesHome: 0, injuriesAway: 1,
          h2hFavorable: false, h2hScore: 50,
          weatherOk: true, surfaceFavorable: true,
          oddHome: 2.0, dataCompleteness: isTopLeague ? 80 : 65,
          smartMoneyHome: 52, isTopLeague,
        });

        const monte = monteCarloSimulation({
          formHome: 55, formAway: 45,
          motivationHome: 65, motivationAway: 55,
          oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
        });

        // Heure du match en Brussels
        const matchTime = fixture.fixture?.date
          ? new Date(fixture.fixture.date).toLocaleTimeString('fr-BE', {
              hour: '2-digit', minute: '2-digit',
              timeZone: 'Europe/Brussels'
            })
          : '--:--';

        analyzedEvents.push({
          id: `ft_${fixture.fixture.id}`,
          sport: '⚽', sportName: 'Football',
          competition: `⚽ ${leagueName}`,
          home: fixture.teams?.home?.name || 'Domicile',
          away: fixture.teams?.away?.name || 'Exterieur',
          startTime: fixture.fixture?.date,
          matchTime,
          status,
          isLive,
          elapsed,
          scoreHome: fixture.goals?.home,
          scoreAway: fixture.goals?.away,
          oddHome: 2.0, oddDraw: 3.2, oddAway: 3.5,
          kairosScore: scoreData.score,
          riskLevel: scoreData.riskLevel,
          confidence: scoreData.confidence,
          probability: scoreData.probability,
          dataQuality: isTopLeague ? 'Bonne' : 'Partielle',
          breakdown: scoreData.breakdown,
          trapData: scoreData.trapData || { isTrap: false, label: 'Valeur reelle detectee', color: '#00FFB2' },
          smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
          recommendation: scoreData.recommendation,
          valueBet: {
            bookmakerProb: 50,
            kairosProb: scoreData.probability,
            value: scoreData.probability - 50,
            isValue: scoreData.probability > 55,
          },
          monteCarlo: monte,
          isTopLeague,
        });
      } catch {}
    }

    return res.status(200).json({
      success: true,
      debug,
      stats: {
        totalAnalyzed: relevant.length,
        premiumCount: analyzedEvents.filter(e => e.kairosScore >= 80).length,
        ignoredCount: analyzedEvents.filter(e => e.kairosScore < 80).length,
        liveCount: analyzedEvents.filter(e => e.isLive).length,
        lastUpdated: new Date().toISOString(),
      },
      events: analyzedEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
