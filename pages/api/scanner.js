const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const ODDS_URL = 'https://api.the-odds-api.com/v4';

const PRIORITY_LEAGUES = new Set([
  2, 3, 10, 39, 40, 61, 62, 71, 78, 79, 88, 94, 98, 103, 113,
  119, 128, 135, 136, 140, 141, 144, 169, 200, 239, 253, 262,
  292, 667, 681, 848, 1, 4, 6, 9
]);

const LEAGUE_NAMES = {
  2: 'Champions League', 3: 'Europa League', 10: 'Amicaux Internationaux',
  39: 'Premier League', 40: 'Championship', 61: 'Ligue 1', 62: 'Ligue 2',
  71: 'Serie A Brésil', 78: 'Bundesliga', 79: 'Bundesliga 2',
  88: 'Eredivisie', 94: 'Liga Portugal', 98: 'J-League',
  103: 'Eliteserien', 113: 'Allsvenskan', 119: 'Superliga',
  128: 'Liga Profesional', 135: 'Serie A', 136: 'Serie B',
  140: 'La Liga', 141: 'Segunda Division', 144: 'Pro League',
  169: 'Chinese Super League', 200: 'Premier Soccer League',
  239: 'Primera Division', 253: 'MLS', 262: 'Liga MX',
  292: 'K-League', 667: 'Amicaux Clubs', 681: 'World Challenge',
  848: 'Conference League', 1: 'World Cup', 4: 'Euro',
  6: 'Africa Cup', 9: 'Copa America',
};

const TOP_LEAGUE_IDS = new Set([2, 3, 39, 61, 78, 88, 94, 135, 140, 144, 848, 1, 4, 6, 9]);
const VALID_STATUSES = new Set(['NS', 'TBD', '1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT']);

const ODDS_SPORT_KEYS = {
  39: 'soccer_england_premier_league',
  135: 'soccer_italy_serie_a',
  140: 'soccer_spain_la_liga',
  78: 'soccer_germany_bundesliga',
  61: 'soccer_france_ligue_one',
  2: 'soccer_uefa_champs_league',
  3: 'soccer_uefa_europa_league',
  848: 'soccer_uefa_europa_conference_league',
  253: 'soccer_usa_mls',
  98: 'soccer_japan_j_league',
};

const OTHER_SPORTS = [
  { key: 'basketball_nba', name: 'NBA', icon: '🏀', sport: 'Basketball' },
  { key: 'tennis_atp_french_open', name: 'Roland Garros ATP', icon: '🎾', sport: 'Tennis' },
  { key: 'tennis_wta_french_open', name: 'Roland Garros WTA', icon: '🎾', sport: 'Tennis' },
  { key: 'icehockey_nhl', name: 'NHL', icon: '🏒', sport: 'Hockey' },
  { key: 'americanfootball_nfl', name: 'NFL', icon: '🏈', sport: 'Football américain' },
];

async function fetchF(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'x-rapidapi-key': API_FOOTBALL_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
      signal: AbortSignal.timeout(7000),
    });
    const d = await res.json();
    return d.response || [];
  } catch { return []; }
}

async function fetchOdds(sportKey) {
  try {
    const res = await fetch(`${ODDS_URL}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    return await res.json() || [];
  } catch { return []; }
}

// Score rapide basé uniquement sur les cotes — pas d'appels API supplémentaires
function quickKairosIndex({ oddHome = 2.0, oddDraw = 3.2, oddAway = 3.5, isTopLeague = false, hasRealOdds = false, isLive = false }) {
  let total = 0;
  const breakdown = [];
  const factors = [];
  const modules = { forme: 0, classement: 0, blessures: 0, h2h: 0, valueBet: 0, contexte: 0, momentum: 0, pieges: 0 };

  // Probabilités implicites
  const tProb = (1/oddHome) + (1/oddDraw) + (1/oddAway);
  const homeProb = Math.round((1/oddHome/tProb)*100);
  const margin = Math.round((tProb-1)*100);

  // Value basée sur margin bookmaker (marge faible = meilleure valeur)
  const valuePts = Math.max(-30, Math.min(80, (10 - margin) * 5));
  total += valuePts;
  modules.valueBet = Math.round(valuePts);
  if (valuePts > 20) { breakdown.push({ label: `Faible marge bookmaker (${margin}%)`, value: Math.round(valuePts), good: true }); factors.push(`✅ Bookmaker marge faible : ${margin}%`); }

  // Contexte
  let ctx = 20;
  if (isTopLeague) { ctx += 40; breakdown.push({ label: 'Compétition premium', value: 40, good: true }); }
  if (hasRealOdds) { ctx += 30; breakdown.push({ label: 'Cotes temps réel', value: 30, good: true }); factors.push(`✅ Cotes en temps réel`); }
  if (isLive) { ctx += 20; breakdown.push({ label: 'Match en direct', value: 20, good: true }); }
  total += ctx;
  modules.contexte = ctx;

  // Piège cote trop basse
  let trap = 0; const traps = [];
  if (oddHome < 1.25) { trap += 100; traps.push('Favori très court — risque piège'); }
  else if (oddHome < 1.45) { trap += 50; traps.push('Favori court — attention'); }
  total -= trap;
  modules.pieges = -trap;

  const idx = Math.max(0, Math.min(1000, Math.round(total + 450)));
  const isTrap = trap >= 80;

  let cls, clr, cli;
  if (idx >= 950) { cls='EXCEPTIONNEL'; clr='#00FFB2'; cli='🟢'; }
  else if (idx >= 900) { cls='TRÈS FORT'; clr='#00FFB2'; cli='🟢'; }
  else if (idx >= 850) { cls='BONNE OPPORTUNITÉ'; clr='#7FFF00'; cli='🟢'; }
  else if (idx >= 800) { cls='JOUABLE'; clr='#FFD700'; cli='🟡'; }
  else if (idx >= 700) { cls='RISQUÉ'; clr='#FF8C00'; cli='🟠'; }
  else { cls='ÉVITER'; clr='#FF4D6D'; cli='🔴'; }

  return {
    kairosIndex: idx, score: Math.round(idx/10),
    classification: cls, classColor: clr, classIcon: cli,
    recommendation: idx>=800?'parier':idx>=700?'surveiller':'ne pas parier',
    riskLevel: idx>=850?'Faible':idx>=750?'Moyen':'Élevé',
    breakdown, factors, modules,
    confidence: Math.min(99, Math.round(idx/11)),
    probability: homeProb,
    dataQuality: isTopLeague && hasRealOdds ? 'Bonne' : hasRealOdds ? 'Partielle' : 'Estimée',
    trapData: { isTrap, traps, label: isTrap?'🔴 Piège détecté':'🟢 Valeur réelle détectée', color: isTrap?'#FF4D6D':'#00FFB2' },
    valueBet: { bookmakerProb: homeProb, kairosProb: homeProb, value: Math.round((10-margin)*0.5), isValue: margin < 8, bookmakerMargin: margin },
  };
}

async function scanFootball(oddsCache) {
  const brusselsTime = new Date(Date.now() + 2*60*60*1000);
  const today = brusselsTime.toISOString().split('T')[0];

  // 1 seul appel pour TOUS les matchs du jour
  const fixtures = await fetchF(`/fixtures?date=${today}`);
  if (!fixtures.length) return [];

  // Dédoublonnage
  const seenIds = new Set();
  const unique = fixtures.filter(f => {
    if (seenIds.has(f.fixture.id)) return false;
    seenIds.add(f.fixture.id); return true;
  });

  let relevant = unique.filter(f => PRIORITY_LEAGUES.has(f.league?.id) && VALID_STATUSES.has(f.fixture?.status?.short));
  if (!relevant.length) relevant = unique.filter(f => VALID_STATUSES.has(f.fixture?.status?.short)).slice(0, 15);
  if (!relevant.length) return [];

  // LIVE en premier puis top ligues
  relevant.sort((a, b) => {
    const aL = ['1H','HT','2H','ET','LIVE'].includes(a.fixture?.status?.short) ? 0 : 1;
    const bL = ['1H','HT','2H','ET','LIVE'].includes(b.fixture?.status?.short) ? 0 : 1;
    if (aL !== bL) return aL - bL;
    return (TOP_LEAGUE_IDS.has(a.league?.id)?0:1) - (TOP_LEAGUE_IDS.has(b.league?.id)?0:1);
  });

  const results = [];
  const seenPairs = new Set();

  for (const fixture of relevant.slice(0, 15)) {
    const pairKey = `${fixture.teams?.home?.id}_${fixture.teams?.away?.id}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const leagueId = fixture.league?.id;
    const isTopLeague = TOP_LEAGUE_IDS.has(leagueId);
    const status = fixture.fixture?.status?.short || 'NS';
    const isLive = ['1H','HT','2H','ET','LIVE','BT'].includes(status);
    const homeTeam = fixture.teams?.home?.name;
    const awayTeam = fixture.teams?.away?.name;

    // Chercher vraies cotes dans le cache
    const oddsKey = `${homeTeam}|${awayTeam}`;
    const realOdds = oddsCache[oddsKey];
    const odds = realOdds || { home: 2.0, draw: 3.2, away: 3.5 };

    // Score rapide sans appels API supplémentaires
    const scoreData = quickKairosIndex({
      oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
      isTopLeague, hasRealOdds: !!realOdds, isLive,
    });

    let matchTime = '--:--';
    try { matchTime = new Date(fixture.fixture?.date).toLocaleTimeString('fr-BE', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Brussels' }); } catch {}

    results.push({
      id: `ft_${fixture.fixture.id}`,
      sport: '⚽', sportName: 'Football',
      competition: `⚽ ${LEAGUE_NAMES[leagueId] || fixture.league?.name || 'Football'}`,
      home: homeTeam, away: awayTeam,
      startTime: fixture.fixture?.date,
      matchTime, status, isLive,
      elapsed: fixture.fixture?.status?.elapsed || 0,
      scoreHome: fixture.goals?.home, scoreAway: fixture.goals?.away,
      oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
      hasRealOdds: !!realOdds,
      ...scoreData,
      kairosScore: scoreData.score,
      isTopLeague,
      rawData: { formHome: [], formAway: [], posHome: 10, posAway: 10, injHome: 0, injAway: 0, h2hHome: 0, h2hAway: 0 },
      monteCarlo: { home: scoreData.probability, draw: 22, away: Math.max(0, 100-scoreData.probability-22) },
    });
  }

  return results;
}

async function scanOtherSports() {
  const events = [];
  const now = new Date();

  for (const sportInfo of OTHER_SPORTS) {
    try {
      const oddsData = await fetchOdds(sportInfo.key);
      if (!oddsData?.length) continue;

      const upcoming = oddsData.filter(g => {
        const t = new Date(g.commence_time);
        const h = (t - now) / 3600000;
        return h > -2 && h < 24;
      }).slice(0, 3);

      for (const game of upcoming) {
        const bk = game.bookmakers?.find(b => b.key==='unibet') || game.bookmakers?.[0];
        if (!bk) continue;
        const h2h = bk.markets?.find(m => m.key==='h2h');
        if (!h2h) continue;

        const homeOdd = parseFloat(h2h.outcomes?.find(o=>o.name===game.home_team)?.price||2.0);
        const awayOdd = parseFloat(h2h.outcomes?.find(o=>o.name===game.away_team)?.price||2.0);
        const drawOdd = parseFloat(h2h.outcomes?.find(o=>o.name==='Draw')?.price||0);
        const isTopSport = ['basketball_nba','tennis_atp_french_open','icehockey_nhl'].includes(sportInfo.key);
        const gameTime = new Date(game.commence_time);
        const isLive = (now-gameTime)>0 && (now-gameTime)<4*3600000;

        const scoreData = quickKairosIndex({ oddHome: homeOdd, oddDraw: drawOdd||100, oddAway: awayOdd, isTopLeague: isTopSport, hasRealOdds: true, isLive });

        let matchTime = '--:--';
        try { matchTime = gameTime.toLocaleTimeString('fr-BE', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Brussels' }); } catch {}

        events.push({
          id: `${sportInfo.key}_${game.id}`,
          sport: sportInfo.icon, sportName: sportInfo.sport,
          competition: `${sportInfo.icon} ${sportInfo.name}`,
          home: game.home_team, away: game.away_team,
          startTime: game.commence_time,
          matchTime, status: isLive?'LIVE':'NS', isLive, elapsed: 0,
          scoreHome: null, scoreAway: null,
          oddHome: homeOdd, oddDraw: drawOdd||null, oddAway: awayOdd,
          hasRealOdds: true,
          ...scoreData,
          kairosScore: scoreData.score,
          isTopLeague: isTopSport,
          rawData: { formHome:[], formAway:[], posHome:5, posAway:8, injHome:0, injAway:0, h2hHome:0, h2hAway:0 },
          monteCarlo: { home: scoreData.probability, draw: drawOdd?15:0, away: Math.max(0,100-scoreData.probability-(drawOdd?15:0)) },
        });
      }
    } catch(e) { console.error(sportInfo.key, e.message); }
  }
  return events;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!API_FOOTBALL_KEY) return res.status(200).json({ success: true, silence: true, stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 }, events: [] });

  try {
    // Charger cotes en parallèle avec le scan football
    const oddsCache = {};

    // Charger cotes pour les top ligues (1 appel)
    const topOddsData = await fetchOdds('soccer_uefa_europa_league');
    for (const game of topOddsData) {
      const key = `${game.home_team}|${game.away_team}`;
      const bk = game.bookmakers?.find(b=>b.key==='unibet')||game.bookmakers?.[0];
      if (bk) {
        const h2h = bk.markets?.find(m=>m.key==='h2h');
        if (h2h) {
          const home = parseFloat(h2h.outcomes?.find(o=>o.name===game.home_team)?.price||0);
          const draw = parseFloat(h2h.outcomes?.find(o=>o.name==='Draw')?.price||0);
          const away = parseFloat(h2h.outcomes?.find(o=>o.name===game.away_team)?.price||0);
          if (home>1) oddsCache[key] = { home, draw:draw||3.2, away:away||3.5 };
        }
      }
    }

    // Scanner football + autres sports en parallèle
    const [footballEvents, otherSportsEvents] = await Promise.all([
      scanFootball(oddsCache),
      scanOtherSports(),
    ]);

    const allEvents = [...footballEvents, ...otherSportsEvents];

    if (!allEvents.length) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [], message: 'Aucun match disponible pour le moment.',
      });
    }

    allEvents.sort((a, b) => {
      const aL = a.isLive?1:0, bL = b.isLive?1:0;
      if (aL!==bL) return bL-aL;
      return b.kairosIndex-a.kairosIndex;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalAnalyzed: allEvents.length,
        premiumCount: allEvents.filter(e=>e.kairosIndex>=800).length,
        ignoredCount: allEvents.filter(e=>e.kairosIndex<800).length,
        liveCount: allEvents.filter(e=>e.isLive).length,
        withRealOdds: allEvents.filter(e=>e.hasRealOdds).length,
        lastUpdated: new Date().toISOString(),
      },
      events: allEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
