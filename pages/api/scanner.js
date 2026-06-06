const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const ODDS_URL = 'https://api.the-odds-api.com/v4';

// ── LIGUES FOOTBALL ──────────────────────────────────────────────────
const PRIORITY_LEAGUES = new Set([
  // Europe Tier 1
  2, 3, 39, 61, 78, 88, 94, 135, 140, 144, 848,
  // Europe Tier 2
  40, 62, 79, 103, 113, 119, 136, 141,
  // Amériques
  71, 128, 239, 253, 262,
  // Asie
  98, 169, 292,
  // Afrique
  200,
  // Internationaux
  1, 4, 6, 9,
  // ✅ AMICAUX INTERNATIONAUX
  10,   // Friendlies internationaux
  667,  // Amicaux clubs
  681,  // World Football Challenge
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
  10: 'Amicaux Internationaux', 667: 'Amicaux Clubs', 681: 'World Football Challenge',
};

const TOP_LEAGUE_IDS = new Set([2, 3, 39, 61, 78, 88, 94, 135, 140, 144, 848, 1, 4, 6, 9]);
const VALID_STATUSES = new Set(['NS', 'TBD', '1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT']);

// ── AUTRES SPORTS (The Odds API) ──────────────────────────────────────
const OTHER_SPORTS = [
  { key: 'basketball_nba', name: 'NBA', icon: '🏀', sport: 'Basketball' },
  { key: 'tennis_atp_french_open', name: 'Roland Garros ATP', icon: '🎾', sport: 'Tennis' },
  { key: 'tennis_wta_french_open', name: 'Roland Garros WTA', icon: '🎾', sport: 'Tennis' },
  { key: 'tennis_atp_singles', name: 'ATP Singles', icon: '🎾', sport: 'Tennis' },
  { key: 'icehockey_nhl', name: 'NHL', icon: '🏒', sport: 'Hockey' },
  { key: 'americanfootball_nfl', name: 'NFL', icon: '🏈', sport: 'Football américain' },
  { key: 'baseball_mlb', name: 'MLB', icon: '⚾', sport: 'Baseball' },
  { key: 'rugbyleague_nrl', name: 'NRL Rugby', icon: '🏉', sport: 'Rugby' },
  { key: 'mma_mixed_martial_arts', name: 'MMA/UFC', icon: '🥊', sport: 'MMA' },
  { key: 'basketball_euroleague', name: 'Euroleague', icon: '🏀', sport: 'Basketball' },
];

const FOOTBALL_ODDS_KEYS = {
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

// ── FETCH HELPERS ─────────────────────────────────────────────────────
async function fetchFootball(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'x-rapidapi-key': API_FOOTBALL_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
      signal: AbortSignal.timeout(6000),
    });
    const d = await res.json();
    return d.response || [];
  } catch { return []; }
}

async function fetchOddsForSport(sportKey) {
  try {
    const res = await fetch(
      `${ODDS_URL}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    return await res.json() || [];
  } catch { return []; }
}

// ── KAIROS INDEX ──────────────────────────────────────────────────────
function calcKairosIndex({ formHome=50, formAway=50, posHome=10, posAway=10, injHome=0, injAway=0, h2hHome=0, h2hAway=0, h2hTotal=0, oddHome=2.0, oddDraw=3.2, oddAway=3.5, isTopLeague=false, hasRealOdds=false, sport='Football' }) {
  let total = 0;
  const modules = {}, breakdown = [], factors = [];

  // Forme
  const fDiff = formHome - formAway;
  const fPts = Math.max(-100, Math.min(200, fDiff * 2));
  total += fPts; modules.forme = Math.round(fPts);
  if (fPts > 20) { breakdown.push({ label: 'Forme favorable', value: Math.round(fPts), good: true }); factors.push(`✅ Meilleure forme récente`); }
  else if (fPts < -20) { breakdown.push({ label: 'Forme défavorable', value: Math.round(fPts), good: false }); factors.push(`⚠️ Forme récente insuffisante`); }

  // Classement (football seulement)
  if (sport === 'Football') {
    const pDiff = posAway - posHome;
    const pPts = Math.max(-75, Math.min(150, pDiff * 5));
    total += pPts; modules.classement = Math.round(pPts);
    if (pDiff > 3) { breakdown.push({ label: `Classement (${posHome}e vs ${posAway}e)`, value: Math.round(pPts), good: true }); factors.push(`✅ ${posHome}e vs ${posAway}e`); }
    else if (pDiff < -3) { breakdown.push({ label: 'Désavantage classement', value: Math.round(pPts), good: false }); }
  } else {
    modules.classement = 0;
  }

  // Blessures
  const injB = Math.min(120, injAway * 30);
  const injP = Math.min(90, injHome * 25);
  total += injB - injP; modules.blessures = injB - injP;
  if (injAway > 0) { breakdown.push({ label: `Blessés adverses (${injAway})`, value: injB, good: true }); }
  if (injHome > 0) { breakdown.push({ label: `Blessés propres (${injHome})`, value: -injP, good: false }); }

  // H2H
  let h2hPts = 0;
  if (h2hTotal > 0) {
    h2hPts = Math.max(-50, Math.min(100, ((h2hHome - h2hAway) / h2hTotal) * 100));
    total += h2hPts;
    if (h2hPts > 20) { breakdown.push({ label: `H2H (${h2hHome}V/${h2hTotal})`, value: Math.round(h2hPts), good: true }); factors.push(`✅ ${h2hHome}V sur ${h2hTotal} matchs`); }
    else if (h2hPts < -20) { breakdown.push({ label: 'H2H défavorable', value: Math.round(h2hPts), good: false }); }
  }
  modules.h2h = Math.round(h2hPts);

  // Value bet
  const tProb = (1/oddHome) + (1/(oddDraw||100)) + (1/oddAway);
  const bkProb = Math.round((1/oddHome/tProb)*100);
  const estProb = Math.round((formHome/(formHome+formAway))*100);
  const vDiff = estProb - bkProb;
  const vPts = Math.max(-50, Math.min(150, vDiff * 3));
  total += vPts; modules.valueBet = Math.round(vPts);
  if (vDiff > 8) { breakdown.push({ label: `Value +${Math.round(vDiff)}%`, value: Math.round(vPts), good: true }); factors.push(`🔥 Value bet : IA ${estProb}% vs bookie ${bkProb}%`); }
  else if (vDiff > 4) { breakdown.push({ label: `Légère value +${Math.round(vDiff)}%`, value: Math.round(vPts), good: true }); factors.push(`✅ Légère valeur détectée`); }

  // Contexte
  let ctx = 20;
  if (isTopLeague) { ctx += 40; breakdown.push({ label: 'Ligue/compétition premium', value: 40, good: true }); }
  if (hasRealOdds) { ctx += 30; breakdown.push({ label: 'Cotes temps réel', value: 30, good: true }); factors.push(`✅ Cotes en temps réel`); }
  total += ctx; modules.contexte = ctx;

  // Momentum
  const mom = Math.max(-40, Math.min(80, fDiff));
  total += mom; modules.momentum = Math.round(mom);

  // Pièges
  let trap = 0; const traps = [];
  if (oddHome < 1.25) { trap += 100; traps.push('Favori très court — risque piège'); }
  else if (oddHome < 1.45) { trap += 50; traps.push('Favori court — attention'); }
  total -= trap; modules.pieges = -trap;

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
    probability: estProb,
    dataQuality: isTopLeague && hasRealOdds ? 'Excellente' : hasRealOdds ? 'Bonne' : 'Partielle',
    trapData: { isTrap, traps, label: isTrap?'🔴 Piège détecté':'🟢 Valeur réelle détectée', color: isTrap?'#FF4D6D':'#00FFB2' },
    valueBet: { bookmakerProb: bkProb, kairosProb: estProb, value: Math.round(vDiff), isValue: vDiff>4, bookmakerMargin: Math.round((tProb-1)*1000)/10 },
  };
}

// ── SCANNER AUTRES SPORTS ─────────────────────────────────────────────
async function scanOtherSports() {
  const events = [];
  const now = new Date();

  for (const sportInfo of OTHER_SPORTS.slice(0, 5)) { // max 5 sports
    try {
      const oddsData = await fetchOddsForSport(sportInfo.key);
      if (!oddsData || !oddsData.length) continue;

      // Filtrer matchs à venir (prochaines 24h)
      const upcoming = oddsData.filter(g => {
        const gameTime = new Date(g.commence_time);
        const hoursUntil = (gameTime - now) / (1000 * 60 * 60);
        return hoursUntil > -2 && hoursUntil < 24;
      }).slice(0, 3);

      for (const game of upcoming) {
        const bk = game.bookmakers?.find(b => b.key === 'unibet') || game.bookmakers?.[0];
        if (!bk) continue;

        const h2h = bk.markets?.find(m => m.key === 'h2h');
        if (!h2h) continue;

        const homeOdd = parseFloat(h2h.outcomes?.find(o => o.name === game.home_team)?.price || 2.0);
        const awayOdd = parseFloat(h2h.outcomes?.find(o => o.name === game.away_team)?.price || 2.0);
        const drawOdd = parseFloat(h2h.outcomes?.find(o => o.name === 'Draw')?.price || 0);

        // Estimer forme basée sur la cote (cote basse = meilleure équipe)
        const formHome = Math.round((1/homeOdd) * 100);
        const formAway = Math.round((1/awayOdd) * 100);

        const gameTime = new Date(game.commence_time);
        const isLive = (now - gameTime) > 0 && (now - gameTime) < 4*60*60*1000;

        const scoreData = calcKairosIndex({
          formHome, formAway,
          posHome: 5, posAway: 8,
          oddHome: homeOdd, oddDraw: drawOdd || 100, oddAway: awayOdd,
          isTopLeague: ['basketball_nba','tennis_atp_french_open','icehockey_nhl','americanfootball_nfl'].includes(sportInfo.key),
          hasRealOdds: true,
          sport: sportInfo.sport,
        });

        let matchTime = '--:--';
        try { matchTime = gameTime.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }); } catch {}

        events.push({
          id: `${sportInfo.key}_${game.id}`,
          sport: sportInfo.icon,
          sportName: sportInfo.sport,
          competition: `${sportInfo.icon} ${sportInfo.name}`,
          home: game.home_team,
          away: game.away_team,
          startTime: game.commence_time,
          matchTime,
          status: isLive ? 'LIVE' : 'NS',
          isLive,
          elapsed: 0,
          scoreHome: null, scoreAway: null,
          oddHome: homeOdd,
          oddDraw: drawOdd || null,
          oddAway: awayOdd,
          hasRealOdds: true,
          kairosIndex: scoreData.kairosIndex,
          kairosScore: scoreData.score,
          classification: scoreData.classification,
          classColor: scoreData.classColor,
          classIcon: scoreData.classIcon,
          riskLevel: scoreData.riskLevel,
          confidence: scoreData.confidence,
          probability: scoreData.probability,
          dataQuality: scoreData.dataQuality,
          breakdown: scoreData.breakdown,
          factors: scoreData.factors,
          modules: scoreData.modules,
          trapData: scoreData.trapData,
          recommendation: scoreData.recommendation,
          valueBet: scoreData.valueBet,
          monteCarlo: { home: scoreData.probability, draw: drawOdd ? 15 : 0, away: 100 - scoreData.probability - (drawOdd ? 15 : 0) },
          isTopLeague: scoreData.dataQuality === 'Excellente',
          rawData: { formHome: [], formAway: [], posHome: 5, posAway: 8, injHome: 0, injAway: 0, h2hHome: 0, h2hAway: 0 },
        });
      }
    } catch (e) { console.error(`Sport ${sportInfo.key} error:`, e.message); }
  }

  return events;
}

// ── SCANNER FOOTBALL ──────────────────────────────────────────────────
async function scanFootball() {
  const brusselsTime = new Date(Date.now() + 2*60*60*1000);
  const today = brusselsTime.toISOString().split('T')[0];
  const season = brusselsTime.getFullYear();

  const fixtures = await fetchFootball(`/fixtures?date=${today}`);
  if (!fixtures.length) return [];

  // Dédoublonnage
  const seenIds = new Set();
  const unique = fixtures.filter(f => {
    if (seenIds.has(f.fixture.id)) return false;
    seenIds.add(f.fixture.id); return true;
  });

  let relevant = unique.filter(f => PRIORITY_LEAGUES.has(f.league?.id) && VALID_STATUSES.has(f.fixture?.status?.short));
  if (!relevant.length) relevant = unique.filter(f => VALID_STATUSES.has(f.fixture?.status?.short)).slice(0, 8);
  if (!relevant.length) return [];

  relevant.sort((a, b) => {
    const aL = ['1H','HT','2H','ET','LIVE'].includes(a.fixture?.status?.short) ? 0 : 1;
    const bL = ['1H','HT','2H','ET','LIVE'].includes(b.fixture?.status?.short) ? 0 : 1;
    if (aL !== bL) return aL - bL;
    return (TOP_LEAGUE_IDS.has(a.league?.id)?0:1) - (TOP_LEAGUE_IDS.has(b.league?.id)?0:1);
  });

  // Cotes football
  const oddsCache = {};
  const firstLeague = relevant[0]?.league?.id;
  if (firstLeague && FOOTBALL_ODDS_KEYS[firstLeague]) {
    const oddsData = await fetchOddsForSport(FOOTBALL_ODDS_KEYS[firstLeague]);
    for (const game of oddsData) {
      const key = `${game.home_team}|${game.away_team}`;
      const bk = game.bookmakers?.find(b => b.key==='unibet') || game.bookmakers?.[0];
      if (bk) {
        const h2h = bk.markets?.find(m => m.key==='h2h');
        if (h2h) {
          const home = parseFloat(h2h.outcomes?.find(o=>o.name===game.home_team)?.price||0);
          const draw = parseFloat(h2h.outcomes?.find(o=>o.name==='Draw')?.price||0);
          const away = parseFloat(h2h.outcomes?.find(o=>o.name===game.away_team)?.price||0);
          if (home > 1) oddsCache[key] = { home, draw: draw||3.2, away: away||3.5 };
        }
      }
    }
  }

  const results = [];
  const seenPairs = new Set();

  for (const fixture of relevant.slice(0, 5)) {
    const pairKey = `${fixture.teams?.home?.id}_${fixture.teams?.away?.id}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    try {
      const homeId = fixture.teams?.home?.id;
      const awayId = fixture.teams?.away?.id;
      const leagueId = fixture.league?.id;
      const isTopLeague = TOP_LEAGUE_IDS.has(leagueId);
      const status = fixture.fixture?.status?.short || 'NS';
      const isLive = ['1H','HT','2H','ET','LIVE','BT'].includes(status);
      const homeTeam = fixture.teams?.home?.name;
      const awayTeam = fixture.teams?.away?.name;

      const formHomeData = await fetchFootball(`/teams/statistics?team=${homeId}&league=${leagueId}&season=${season}`);
      const formAwayData = await fetchFootball(`/teams/statistics?team=${awayId}&league=${leagueId}&season=${season}`);

      const parseForm = (d) => {
        if (!d?.form) return { score: 50, str: [] };
        const f = d.form.slice(-5).split('');
        let score = 50;
        for (const r of f) { if(r==='W') score+=10; else if(r==='D') score+=2; else if(r==='L') score-=8; }
        return { score: Math.max(0,Math.min(100,score)), str: f };
      };

      const fHome = parseForm(formHomeData);
      const fAway = parseForm(formAwayData);

      const stData = await fetchFootball(`/standings?league=${leagueId}&season=${season}`);
      const standings = stData[0]?.league?.standings?.[0] || [];
      const posHome = standings.find(s=>s.team.id===homeId)?.rank || 10;
      const posAway = standings.find(s=>s.team.id===awayId)?.rank || 10;

      const h2hData = await fetchFootball(`/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`);
      let h2hHome=0, h2hAway=0;
      for (const m of h2hData) { if(m.goals.home>m.goals.away) h2hHome++; else if(m.goals.home<m.goals.away) h2hAway++; }

      const oddsKey = `${homeTeam}|${awayTeam}`;
      const realOdds = oddsCache[oddsKey];
      const odds = realOdds || { home: 2.0, draw: 3.2, away: 3.5 };

      const scoreData = calcKairosIndex({
        formHome: fHome.score, formAway: fAway.score,
        posHome, posAway, injHome: 0, injAway: 0,
        h2hHome, h2hAway, h2hTotal: h2hData.length,
        oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
        isTopLeague, hasRealOdds: !!realOdds, sport: 'Football',
      });

      let matchTime = '--:--';
      try { matchTime = new Date(fixture.fixture?.date).toLocaleTimeString('fr-BE', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Brussels' }); } catch {}

      const homeProb = fHome.score / (fHome.score + fAway.score);

      results.push({
        id: `ft_${fixture.fixture.id}`,
        sport: '⚽', sportName: 'Football',
        competition: `⚽ ${LEAGUE_NAMES[leagueId] || fixture.league?.name}`,
        home: homeTeam, away: awayTeam,
        startTime: fixture.fixture?.date,
        matchTime, status, isLive,
        elapsed: fixture.fixture?.status?.elapsed || 0,
        scoreHome: fixture.goals?.home, scoreAway: fixture.goals?.away,
        oddHome: odds.home, oddDraw: odds.draw, oddAway: odds.away,
        hasRealOdds: !!realOdds,
        kairosIndex: scoreData.kairosIndex,
        kairosScore: scoreData.score,
        classification: scoreData.classification,
        classColor: scoreData.classColor,
        classIcon: scoreData.classIcon,
        riskLevel: scoreData.riskLevel,
        confidence: scoreData.confidence,
        probability: scoreData.probability,
        dataQuality: scoreData.dataQuality,
        breakdown: scoreData.breakdown,
        factors: scoreData.factors,
        modules: scoreData.modules,
        trapData: scoreData.trapData,
        recommendation: scoreData.recommendation,
        valueBet: scoreData.valueBet,
        monteCarlo: { home: Math.round(homeProb*100), draw: 22, away: Math.max(0, Math.round((1-homeProb)*100)-22) },
        isTopLeague,
        rawData: { formHome: fHome.str, formAway: fAway.str, posHome, posAway, injHome: 0, injAway: 0, h2hHome, h2hAway },
      });
    } catch (e) { console.error('Football error:', e.message); }
  }

  return results;
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  if (!API_FOOTBALL_KEY) return res.status(200).json({ success: true, silence: true, stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 }, events: [] });

  try {
    // Scanner football + autres sports en parallèle
    const [footballEvents, otherSportsEvents] = await Promise.all([
      scanFootball(),
      scanOtherSports(),
    ]);

    const allEvents = [...footballEvents, ...otherSportsEvents];

    if (!allEvents.length) {
      return res.status(200).json({
        success: true, silence: true,
        stats: { totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 },
        events: [],
        message: 'Aucun match disponible pour le moment.',
      });
    }

    // Trier LIVE en premier, puis par indice décroissant
    allEvents.sort((a, b) => {
      const aL = a.isLive ? 1 : 0;
      const bL = b.isLive ? 1 : 0;
      if (aL !== bL) return bL - aL;
      return b.kairosIndex - a.kairosIndex;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalAnalyzed: allEvents.length,
        premiumCount: allEvents.filter(e => e.kairosIndex >= 800).length,
        ignoredCount: allEvents.filter(e => e.kairosIndex < 800).length,
        liveCount: allEvents.filter(e => e.isLive).length,
        withRealOdds: allEvents.filter(e => e.hasRealOdds).length,
        sportBreakdown: {
          football: footballEvents.length,
          autres: otherSportsEvents.length,
        },
        lastUpdated: new Date().toISOString(),
      },
      events: allEvents,
    });

  } catch (err) {
    console.error('Scanner error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
