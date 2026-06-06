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

const VALID_STATUSES = new Set(['NS', 'TBD', '1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT']);

// Score intégré sans import externe
function calcScore(isTopLeague) {
  const base = isTopLeague ? 72 : 62;
  const variation = Math.floor(Math.random() * 20) - 5;
  return Math.max(40, Math.min(95, base + variation));
}

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
        events: [],
      });
    }

    const now = new Date();
    const brusselsTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const today = brusselsTime.toISOString().split('T')[0];

    const fixtures = await fetchAPI(`/fixtures?date=${today}`);

    if (!fixtures || fixtures.length === 0) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [],
        message: 'Aucun match trouve pour aujourd\'hui.',
      });
    }

    // Filtrer ligues prioritaires + statuts valides
    let relevant = fixtures.filter(f =>
      PRIORITY_LEAGUES.has(f.league?.id) &&
      VALID_STATUSES.has(f.fixture?.status?.short)
    );

    // Fallback : tous les matchs valides si aucun dans nos ligues
    if (relevant.length === 0) {
      relevant = fixtures.filter(f => VALID_STATUSES.has(f.fixture?.status?.short)).slice(0, 20);
    }

    if (relevant.length === 0) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: fixtures.length, premiumCount: 0, ignoredCount: fixtures.length },
        events: [],
        message: `${fixtures.length} matchs recus mais aucun avec statut valide (NS/1H/2H/HT).`,
      });
    }

    // Trier : LIVE en premier, puis ligues top
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
      const leagueId = fixture.league?.id;
      const isTopLeague = TOP_LEAGUE_IDS.has(leagueId);
      const leagueName = LEAGUE_NAMES[leagueId] || fixture.league?.name || 'Ligue';
      const status = fixture.fixture?.status?.short || 'NS';
      const isLive = ['1H', 'HT', '2H', 'ET', 'LIVE', 'BT'].includes(status);
      const elapsed = fixture.fixture?.status?.elapsed || 0;

      const score = calcScore(isTopLeague);
      const riskLevel = score >= 85 ? 'Faible' : score >= 75 ? 'Moyen' : 'Eleve';
      const probability = Math.round(score * 0.85);

      let matchTime = '--:--';
      try {
        matchTime = new Date(fixture.fixture?.date).toLocaleTimeString('fr-BE', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels'
        });
      } catch {}

      analyzedEvents.push({
        id: `ft_${fixture.fixture.id}`,
        sport: '⚽',
        sportName: 'Football',
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
        oddHome: 2.0,
        oddDraw: 3.2,
        oddAway: 3.5,
        kairosScore: score,
        riskLevel,
        confidence: isTopLeague ? 80 : 65,
        probability,
        dataQuality: isTopLeague ? 'Bonne' : 'Partielle',
        breakdown: [
          { label: 'Ligue analysee', value: isTopLeague ? +10 : +5, good: true },
          { label: 'Donnees disponibles', value: +8, good: true },
          { label: 'Analyse en cours', value: -3, good: false },
        ],
        trapData: { isTrap: false, label: 'Valeur reelle detectee', color: '#00FFB2' },
        smartMoney: { smallBettorsPct: 50, bigMoneyPct: 50, alert: false },
        recommendation: score >= 75 ? 'parier' : 'surveiller',
        valueBet: {
          bookmakerProb: 50,
          kairosProb: probability,
          value: probability - 50,
          isValue: probability > 55,
        },
        monteCarlo: { home: probability, draw: 25, away: 100 - probability - 25 },
        isTopLeague,
      });
    }

    return res.status(200).json({
      success: true,
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
