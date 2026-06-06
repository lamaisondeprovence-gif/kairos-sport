import { useState, useEffect } from 'react';
import Head from 'next/head';

// ── DONNÉES CHAMPIONNATS ──────────────────────────────────────────────
const LEAGUES = {
  serie_a: {
    name: 'Serie A', country: '🇮🇹', flag: '🇮🇹', icon: '⚽',
    teams: [
      { name: 'Inter Milan', strength: 92, form: 90, odds: 2.5, homeStr: 88, awayStr: 85, attack: 88, defense: 90 },
      { name: 'Napoli', strength: 88, form: 85, odds: 3.5, homeStr: 86, awayStr: 80, attack: 85, defense: 84 },
      { name: 'Juventus', strength: 85, form: 82, odds: 4.5, homeStr: 84, awayStr: 78, attack: 80, defense: 85 },
      { name: 'AC Milan', strength: 84, form: 80, odds: 5.0, homeStr: 83, awayStr: 76, attack: 82, defense: 80 },
      { name: 'Atalanta', strength: 83, form: 85, odds: 6.0, homeStr: 82, awayStr: 78, attack: 86, defense: 78 },
      { name: 'Roma', strength: 78, form: 75, odds: 12.0, homeStr: 78, awayStr: 70, attack: 76, defense: 74 },
      { name: 'Lazio', strength: 76, form: 73, odds: 15.0, homeStr: 76, awayStr: 68, attack: 74, defense: 72 },
      { name: 'Fiorentina', strength: 74, form: 72, odds: 20.0, homeStr: 74, awayStr: 66, attack: 72, defense: 70 },
      { name: 'Bologna', strength: 72, form: 70, odds: 25.0, homeStr: 72, awayStr: 64, attack: 70, defense: 68 },
      { name: 'Torino', strength: 68, form: 65, odds: 50.0, homeStr: 68, awayStr: 60, attack: 65, defense: 66 },
    ]
  },
  la_liga: {
    name: 'La Liga', country: '🇪🇸', flag: '🇪🇸', icon: '⚽',
    teams: [
      { name: 'Real Madrid', strength: 95, form: 92, odds: 1.8, homeStr: 94, awayStr: 90, attack: 92, defense: 90 },
      { name: 'Barcelona', strength: 90, form: 88, odds: 3.0, homeStr: 92, awayStr: 85, attack: 90, defense: 85 },
      { name: 'Atletico Madrid', strength: 85, form: 82, odds: 5.0, homeStr: 86, awayStr: 80, attack: 78, defense: 90 },
      { name: 'Villarreal', strength: 76, form: 73, odds: 20.0, homeStr: 76, awayStr: 68, attack: 74, defense: 72 },
      { name: 'Athletic Bilbao', strength: 74, form: 75, odds: 25.0, homeStr: 78, awayStr: 65, attack: 72, defense: 74 },
      { name: 'Real Sociedad', strength: 73, form: 70, odds: 30.0, homeStr: 74, awayStr: 65, attack: 71, defense: 70 },
      { name: 'Sevilla', strength: 72, form: 68, odds: 35.0, homeStr: 72, awayStr: 64, attack: 70, defense: 70 },
      { name: 'Betis', strength: 70, form: 68, odds: 40.0, homeStr: 70, awayStr: 63, attack: 68, defense: 68 },
      { name: 'Valencia', strength: 65, form: 62, odds: 60.0, homeStr: 66, awayStr: 58, attack: 63, defense: 63 },
      { name: 'Getafe', strength: 60, form: 58, odds: 80.0, homeStr: 62, awayStr: 54, attack: 56, defense: 64 },
    ]
  },
  ligue_1: {
    name: 'Ligue 1', country: '🇫🇷', flag: '🇫🇷', icon: '⚽',
    teams: [
      { name: 'PSG', strength: 94, form: 90, odds: 1.4, homeStr: 96, awayStr: 90, attack: 94, defense: 88 },
      { name: 'Monaco', strength: 82, form: 80, odds: 6.0, homeStr: 84, awayStr: 76, attack: 80, defense: 78 },
      { name: 'Lille', strength: 78, form: 76, odds: 10.0, homeStr: 80, awayStr: 72, attack: 75, defense: 78 },
      { name: 'Lyon', strength: 76, form: 73, odds: 15.0, homeStr: 78, awayStr: 70, attack: 74, defense: 72 },
      { name: 'Marseille', strength: 74, form: 70, odds: 18.0, homeStr: 76, awayStr: 68, attack: 72, defense: 70 },
      { name: 'Nice', strength: 72, form: 70, odds: 22.0, homeStr: 74, awayStr: 66, attack: 70, defense: 72 },
      { name: 'Rennes', strength: 70, form: 68, odds: 28.0, homeStr: 72, awayStr: 64, attack: 68, defense: 68 },
      { name: 'Lens', strength: 69, form: 67, odds: 30.0, homeStr: 70, awayStr: 63, attack: 67, defense: 67 },
      { name: 'Strasbourg', strength: 62, form: 60, odds: 60.0, homeStr: 64, awayStr: 56, attack: 60, defense: 60 },
      { name: 'Brest', strength: 65, form: 66, odds: 40.0, homeStr: 66, awayStr: 60, attack: 64, defense: 62 },
    ]
  },
  pro_league: {
    name: 'Pro League', country: '🇧🇪', flag: '🇧🇪', icon: '⚽',
    teams: [
      { name: 'Club Brugge', strength: 82, form: 80, odds: 2.5, homeStr: 84, awayStr: 78, attack: 80, defense: 80 },
      { name: 'Anderlecht', strength: 78, form: 75, odds: 4.0, homeStr: 80, awayStr: 73, attack: 76, defense: 74 },
      { name: 'Genk', strength: 75, form: 73, odds: 6.0, homeStr: 76, awayStr: 70, attack: 74, defense: 72 },
      { name: 'Union SG', strength: 73, form: 72, odds: 8.0, homeStr: 74, awayStr: 68, attack: 72, defense: 70 },
      { name: 'Gent', strength: 70, form: 68, odds: 12.0, homeStr: 72, awayStr: 64, attack: 68, defense: 68 },
      { name: 'Standard Liège', strength: 65, form: 62, odds: 25.0, homeStr: 66, awayStr: 58, attack: 63, defense: 63 },
      { name: 'Antwerp', strength: 68, form: 65, odds: 18.0, homeStr: 70, awayStr: 62, attack: 66, defense: 66 },
      { name: 'Westerlo', strength: 60, form: 58, odds: 40.0, homeStr: 62, awayStr: 54, attack: 58, defense: 58 },
    ]
  },
  bundesliga: {
    name: 'Bundesliga', country: '🇩🇪', flag: '🇩🇪', icon: '⚽',
    teams: [
      { name: 'Bayern Munich', strength: 93, form: 88, odds: 1.6, homeStr: 94, awayStr: 90, attack: 92, defense: 88 },
      { name: 'Bayer Leverkusen', strength: 88, form: 90, odds: 3.5, homeStr: 88, awayStr: 84, attack: 90, defense: 84 },
      { name: 'Borussia Dortmund', strength: 84, form: 80, odds: 6.0, homeStr: 86, awayStr: 80, attack: 84, defense: 78 },
      { name: 'RB Leipzig', strength: 82, form: 78, odds: 8.0, homeStr: 82, awayStr: 78, attack: 80, defense: 80 },
      { name: 'Stuttgart', strength: 76, form: 74, odds: 20.0, homeStr: 76, awayStr: 70, attack: 74, defense: 72 },
      { name: 'Eintracht Frankfurt', strength: 74, form: 72, odds: 25.0, homeStr: 74, awayStr: 68, attack: 72, defense: 70 },
      { name: 'Wolfsburg', strength: 70, form: 68, odds: 35.0, homeStr: 70, awayStr: 64, attack: 68, defense: 68 },
      { name: 'Freiburg', strength: 68, form: 66, odds: 40.0, homeStr: 70, awayStr: 62, attack: 65, defense: 68 },
      { name: 'Hoffenheim', strength: 65, form: 62, odds: 60.0, homeStr: 66, awayStr: 58, attack: 63, defense: 62 },
      { name: 'Mainz', strength: 62, form: 60, odds: 80.0, homeStr: 64, awayStr: 56, attack: 60, defense: 60 },
    ]
  },
};

function calcMatchResult(t1, t2, homeAdvantage = true) {
  const s1 = t1.strength * 0.5 + t1.form * 0.3 + (homeAdvantage ? t1.homeStr : t1.awayStr) * 0.2;
  const s2 = t2.strength * 0.5 + t2.form * 0.3 + t2.awayStr * 0.2;
  const total = s1 + s2;
  const p1 = (s1 / total) * 100;
  const draw = Math.min(25, (100 - Math.abs(p1 - 50)) * 0.3);
  return { p1: Math.max(5, p1), draw: Math.max(5, draw), p2: Math.max(5, 100 - p1 - draw) };
}

function simulateLeague(leagueKey, iterations = 10000) {
  const league = LEAGUES[leagueKey];
  const teams = league.teams;
  const results = {};
  teams.forEach(t => { results[t.name] = { pts: 0, gf: 0, ga: 0, wins: 0, draws: 0, losses: 0, played: 0 }; });

  // Simuler une saison complète
  for (let iter = 0; iter < iterations; iter++) {
    const seasonPts = {};
    teams.forEach(t => { seasonPts[t.name] = 0; });

    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i === j) continue;
        const home = teams[i], away = teams[j];
        const { p1, draw } = calcMatchResult(home, away, true);
        const r = Math.random() * 100;
        if (r < p1) { seasonPts[home.name] += 3; }
        else if (r < p1 + draw) { seasonPts[home.name] += 1; seasonPts[away.name] += 1; }
        else { seasonPts[away.name] += 3; }
      }
    }

    // Classer et attribuer positions
    const sorted = Object.entries(seasonPts).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([name, pts], idx) => {
      if (!results[name]) results[name] = { pts: 0, top4: 0, winner: 0, relegated: 0 };
      results[name].pts += pts;
      if (idx === 0) results[name].winner = (results[name].winner || 0) + 1;
      if (idx < 4) results[name].top4 = (results[name].top4 || 0) + 1;
      if (idx >= teams.length - 3) results[name].relegated = (results[name].relegated || 0) + 1;
    });
  }

  return teams.map(t => ({
    name: t.name,
    strength: t.strength,
    form: t.form,
    odds: t.odds,
    attack: t.attack,
    defense: t.defense,
    winner: Math.round(((results[t.name]?.winner || 0) / iterations) * 100),
    top4: Math.round(((results[t.name]?.top4 || 0) / iterations) * 100),
    relegated: Math.round(((results[t.name]?.relegated || 0) / iterations) * 100),
    avgPts: Math.round((results[t.name]?.pts || 0) / iterations),
  })).sort((a, b) => b.winner - a.winner);
}

function generateWeeklyFixtures(leagueKey) {
  const league = LEAGUES[leagueKey];
  const teams = [...league.teams];
  const fixtures = [];

  // Générer 5 matchs de la prochaine journée
  for (let i = 0; i < Math.min(5, Math.floor(teams.length / 2)); i++) {
    const home = teams[i * 2];
    const away = teams[i * 2 + 1];
    if (!home || !away) continue;

    const { p1, draw, p2 } = calcMatchResult(home, away, true);
    const homeOdd = parseFloat((100 / p1 * 1.1).toFixed(2));
    const drawOdd = parseFloat((100 / draw * 1.1).toFixed(2));
    const awayOdd = parseFloat((100 / p2 * 1.1).toFixed(2));

    // Kairos Index basé sur value bet
    const bookProb = Math.round(100 / homeOdd);
    const valueDiff = Math.round(p1) - bookProb;
    const kairosIndex = Math.max(400, Math.min(950, 500 + valueDiff * 5 + (home.strength - away.strength) * 2));

    fixtures.push({
      home: home.name, away: away.name,
      homeStrength: home.strength, awayStrength: away.strength,
      homeForm: home.form, awayForm: away.form,
      prob: { home: Math.round(p1), draw: Math.round(draw), away: Math.round(p2) },
      odds: { home: homeOdd, draw: drawOdd, away: awayOdd },
      kairosIndex,
      prediction: p1 > p2 + 15 ? home.name : p2 > p1 + 15 ? away.name : 'Nul possible',
      confidence: Math.round(Math.max(p1, p2)),
      valueBet: valueDiff > 5 ? { isValue: true, value: valueDiff, team: home.name } : null,
    });
  }

  return fixtures;
}

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: 'monospace' },
  shell: { maxWidth: 430, margin: '0 auto' },
  header: { padding: '14px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 2 },
  tab: (a) => ({ flex: 1, background: a ? '#00FFB220' : 'transparent', border: `1px solid ${a ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '7px 2px', color: a ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 8, fontWeight: a ? 700 : 400, letterSpacing: 1, textTransform: 'uppercase' }),
  leagueBtn: (a) => ({ flex: 1, background: a ? '#00FFB215' : '#0d1526', border: `1px solid ${a ? '#00FFB244' : '#1e2a40'}`, borderRadius: 10, padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }),
};

const getColor = (p) => p >= 40 ? '#00FFB2' : p >= 20 ? '#7FFF00' : p >= 10 ? '#FFD700' : p >= 5 ? '#FF8C00' : '#FF4D6D';

export default function Leagues() {
  const [selectedLeague, setSelectedLeague] = useState('serie_a');
  const [tab, setTab] = useState('standings');
  const [simResults, setSimResults] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    setSimResults(null);
    setFixtures(generateWeeklyFixtures(selectedLeague));
  }, [selectedLeague]);

  const runSim = () => {
    setLoading(true);
    setTimeout(() => {
      setSimResults(simulateLeague(selectedLeague, 10000));
      setLoading(false);
    }, 50);
  };

  const league = LEAGUES[selectedLeague];

  const renderLeagueSelector = () => (
    <div style={{ padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
      {Object.entries(LEAGUES).map(([key, l]) => (
        <button key={key} style={{ ...S.leagueBtn(selectedLeague === key), minWidth: 70 }} onClick={() => setSelectedLeague(key)}>
          <div style={{ fontSize: 18 }}>{l.flag}</div>
          <div style={{ color: selectedLeague === key ? '#00FFB2' : '#4a5568', fontSize: 8, marginTop: 2, letterSpacing: 1 }}>{l.name}</div>
        </button>
      ))}
    </div>
  );

  const renderStandings = () => (
    <div style={{ padding: '0 16px 100px' }}>
      {!simResults ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{league.flag}</div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{league.name}</div>
          <div style={{ color: '#4a5568', fontSize: 11, marginBottom: 24, lineHeight: 1.8 }}>
            Monte Carlo · 10 000 simulations<br />
            {league.teams.length} équipes · Saison complète
          </div>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, border: '3px solid #1e2a40', borderTop: `3px solid #00FFB2`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: '#4a5568', fontSize: 11, letterSpacing: 2 }}>SIMULATION EN COURS...</div>
              </div>
            : <button style={S.btn} onClick={runSim}>⚡ SIMULER LA SAISON</button>
          }
        </div>
      ) : (
        <>
          <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginTop: 16 }}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>🎲 {league.flag} {league.name} — 10 000 SIMULATIONS</div>
          </div>

          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              {['Équipe', 'Champ.', 'Top 4', 'Pts moy', 'Relég.'].map(h => (
                <div key={h} style={{ color: '#4a5568', fontSize: 8, textAlign: h === 'Équipe' ? 'left' : 'right', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {simResults.map((t, i) => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '8px 0', borderTop: '1px solid #1e2a40', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#4a5568', fontSize: 10 }}>{i+1}.</span>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: i < 3 ? 700 : 400 }}>{t.name}</div>
                    <div style={{ color: '#4a5568', fontSize: 8 }}>@{t.odds}</div>
                  </div>
                </div>
                <div style={{ color: getColor(t.winner), fontWeight: 700, fontSize: 12, textAlign: 'right' }}>{t.winner}%</div>
                <div style={{ color: getColor(t.top4/4), fontSize: 11, textAlign: 'right' }}>{t.top4}%</div>
                <div style={{ color: '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.avgPts}</div>
                <div style={{ color: t.relegated > 20 ? '#FF4D6D' : '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.relegated}%</div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn, background: 'transparent', color: '#00FFB2', border: '1px solid #00FFB244' }} onClick={runSim}>🔄 RELANCER</button>
        </>
      )}
    </div>
  );

  const renderFixtures = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ ...S.card, background: '#FFD70015', border: '1px solid #FFD70044' }}>
        <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13 }}>📅 PROCHAINE JOURNÉE — {league.flag} {league.name}</div>
        <div style={{ color: '#4a5568', fontSize: 10, marginTop: 4 }}>Pronostics KAIROS + probabilités Monte Carlo</div>
      </div>

      {fixtures.map((f, i) => (
        <div key={i} style={{ ...S.card, borderColor: f.kairosIndex >= 800 ? '#00FFB244' : f.kairosIndex >= 700 ? '#FFD70044' : '#1e2a40' }}>
          {/* Header match */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{f.home}</div>
              <div style={{ color: '#4a5568', fontSize: 10, margin: '2px 0' }}>vs</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{f.away}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: f.kairosIndex >= 800 ? '#00FFB2' : f.kairosIndex >= 700 ? '#FFD700' : '#FF4D6D', fontWeight: 900, fontSize: 22 }}>{f.kairosIndex}</div>
              <div style={{ color: '#4a5568', fontSize: 8 }}>/1000</div>
              <div style={{ fontSize: 14 }}>{f.kairosIndex >= 800 ? '🟢' : f.kairosIndex >= 700 ? '🟡' : '🔴'}</div>
            </div>
          </div>

          {/* Probabilités Monte Carlo */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[
              ['Domicile', f.prob.home, '#00FFB2'],
              ['Nul', f.prob.draw, '#4a5568'],
              ['Extérieur', f.prob.away, '#FF8C00'],
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: 1, background: '#07090f', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ color: col, fontWeight: 700, fontSize: 16 }}>{val}%</div>
                <div style={{ color: '#4a5568', fontSize: 8 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Cotes */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[['1', f.odds.home, '#00FFB2'], ['X', f.odds.draw, '#4a5568'], ['2', f.odds.away, '#FF8C00']].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: 1, background: '#07090f', borderRadius: 8, padding: '6px', textAlign: 'center' }}>
                <div style={{ color: '#4a5568', fontSize: 9 }}>{lbl}</div>
                <div style={{ color: col, fontWeight: 700, fontSize: 14 }}>@{val}</div>
              </div>
            ))}
          </div>

          {/* Pronostic */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#4a5568', fontSize: 9, letterSpacing: 1 }}>PRONOSTIC KAIROS</div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 12 }}>✅ {f.prediction} ({f.confidence}%)</div>
            </div>
            {f.valueBet && (
              <div style={{ background: '#FF6B0020', border: '1px solid #FF6B0044', borderRadius: 8, padding: '4px 8px' }}>
                <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: 10 }}>🔥 VALUE +{f.valueBet.value}%</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalysis = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244' }}>
        <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>📊 ANALYSE {league.flag} {league.name}</div>
      </div>

      {league.teams.slice(0, 5).map((t, i) => (
        <div key={t.name} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{i+1}. {t.name}</div>
              <div style={{ color: '#4a5568', fontSize: 10 }}>Cote championnat @{t.odds}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#00FFB2', fontWeight: 900, fontSize: 20 }}>{t.strength}</div>
              <div style={{ color: '#4a5568', fontSize: 8 }}>FORCE</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {[['Forme', t.form, '#00FFB2'], ['Attaque', t.attack, '#FF6B00'], ['Défense', t.defense, '#4169E1'], ['Domicile', t.homeStr, '#FFD700']].map(([lbl, val, col]) => (
              <div key={lbl} style={{ background: '#07090f', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ color: col, fontWeight: 700, fontSize: 16 }}>{val}</div>
                <div style={{ color: '#4a5568', fontSize: 8 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Head>
        <title>KAIROS — Championnats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>⚽ CHAMPIONNATS</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 3 }}>KAIROS LEAGUE PREDICTOR</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none' }}>← KAIROS</a>
          </div>

          {/* Sélecteur de championnat */}
          {renderLeagueSelector()}

          {/* Onglets */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 4 }}>
            {[['standings','🏆 Saison'],['fixtures','📅 Journée'],['analysis','📊 Analyse']].map(([id, lbl]) => (
              <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {tab === 'standings' && renderStandings()}
          {tab === 'fixtures' && renderFixtures()}
          {tab === 'analysis' && renderAnalysis()}
        </div>
      </div>
    </>
  );
}
