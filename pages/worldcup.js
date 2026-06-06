// pages/worldcup.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

// ── DONNÉES COUPE DU MONDE 2026 ──────────────────────────────────────
const TEAMS = {
  // Groupe A
  'USA': { flag: '🇺🇸', fifa: 13, group: 'A', odds: 51, strength: 72, form: 65, color: '#B22234' },
  'Uruguay': { flag: '🇺🇾', fifa: 17, group: 'A', odds: 81, strength: 78, form: 70, color: '#5EB6E4' },
  'Panama': { flag: '🇵🇦', fifa: 49, group: 'A', odds: 201, strength: 52, form: 48, color: '#DB0000' },
  'Bolivia': { flag: '🇧🇴', fifa: 85, group: 'A', odds: 301, strength: 42, form: 40, color: '#D52B1E' },

  // Groupe B
  'Argentine': { flag: '🇦🇷', fifa: 1, group: 'B', odds: 10, strength: 95, form: 92, color: '#74ACDF' },
  'Maroc': { flag: '🇲🇦', fifa: 14, group: 'B', odds: 51, strength: 73, form: 75, color: '#C1272D' },
  'Équateur': { flag: '🇪🇨', fifa: 36, group: 'B', odds: 101, strength: 58, form: 55, color: '#FFD100' },
  'Kenya': { flag: '🇰🇪', fifa: 95, group: 'B', odds: 501, strength: 35, form: 32, color: '#006600' },

  // Groupe C
  'Mexique': { flag: '🇲🇽', fifa: 16, group: 'C', odds: 67, strength: 70, form: 65, color: '#006847' },
  'Allemagne': { flag: '🇩🇪', fifa: 4, group: 'C', odds: 13, strength: 88, form: 85, color: '#000000' },
  'Japon': { flag: '🇯🇵', fifa: 15, group: 'C', odds: 67, strength: 71, form: 73, color: '#BC002D' },
  'Côte d\'Ivoire': { flag: '🇨🇮', fifa: 27, group: 'C', odds: 101, strength: 62, form: 60, color: '#F77F00' },

  // Groupe D
  'Brésil': { flag: '🇧🇷', fifa: 5, group: 'D', odds: 9, strength: 90, form: 87, color: '#009C3B' },
  'Suisse': { flag: '🇨🇭', fifa: 21, group: 'D', odds: 67, strength: 68, form: 70, color: '#FF0000' },
  'Serbie': { flag: '🇷🇸', fifa: 25, group: 'D', odds: 101, strength: 63, form: 60, color: '#C6363C' },
  'Cameroun': { flag: '🇨🇲', fifa: 44, group: 'D', odds: 151, strength: 55, form: 52, color: '#007A5E' },

  // Groupe E
  'Espagne': { flag: '🇪🇸', fifa: 2, group: 'E', odds: 5.5, strength: 93, form: 95, color: '#AA151B' },
  'Croatie': { flag: '🇭🇷', fifa: 10, group: 'E', odds: 81, strength: 75, form: 72, color: '#FF0000' },
  'Maroc2': { flag: '🇲🇦', fifa: 14, group: 'E', odds: 51, strength: 73, form: 75, color: '#C1272D' },
  'Sénégal': { flag: '🇸🇳', fifa: 20, group: 'E', odds: 101, strength: 66, form: 68, color: '#00853F' },

  // Groupe F
  'France': { flag: '🇫🇷', fifa: 3, group: 'F', odds: 5.6, strength: 92, form: 90, color: '#002395' },
  'Pays-Bas': { flag: '🇳🇱', fifa: 7, group: 'F', odds: 19, strength: 82, form: 80, color: '#FF6600' },
  'Autriche': { flag: '🇦🇹', fifa: 23, group: 'F', odds: 151, strength: 65, form: 62, color: '#ED2939' },
  'Tunisie': { flag: '🇹🇳', fifa: 32, group: 'F', odds: 201, strength: 56, form: 53, color: '#E70013' },

  // Groupe G
  'Portugal': { flag: '🇵🇹', fifa: 6, group: 'G', odds: 10, strength: 89, form: 88, color: '#006600' },
  'Angleterre': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fifa: 5, group: 'G', odds: 7, strength: 87, form: 85, color: '#CF142B' },
  'Colombie': { flag: '🇨🇴', fifa: 19, group: 'G', odds: 34, strength: 74, form: 72, color: '#FCD116' },
  'Norvège': { flag: '🇳🇴', fifa: 22, group: 'G', odds: 26, strength: 67, form: 70, color: '#EF2B2D' },

  // Groupe H
  'Belgique': { flag: '🇧🇪', fifa: 3, group: 'H', odds: 34, strength: 80, form: 75, color: '#000000' },
  'Canada': { flag: '🇨🇦', fifa: 44, group: 'H', odds: 101, strength: 63, form: 65, color: '#FF0000' },
  'Turquie': { flag: '🇹🇷', fifa: 26, group: 'H', odds: 101, strength: 64, form: 66, color: '#E30A17' },
  'Suède': { flag: '🇸🇪', fifa: 28, group: 'H', odds: 101, strength: 62, form: 60, color: '#006AA7' },
};

// Groupes simplifiés pour affichage
const GROUPS = {
  A: ['USA', 'Uruguay', 'Panama', 'Bolivia'],
  B: ['Argentine', 'Maroc', 'Équateur', 'Kenya'],
  C: ['Mexique', 'Allemagne', 'Japon', "Côte d'Ivoire"],
  D: ['Brésil', 'Suisse', 'Serbie', 'Cameroun'],
  E: ['Espagne', 'Croatie', 'Sénégal', 'Tunisie'],
  F: ['France', 'Pays-Bas', 'Autriche', 'Colombie'],
  G: ['Portugal', 'Angleterre', 'Norvège', 'Canada'],
  H: ['Belgique', 'Turquie', 'Suède', 'Argentine'],
};

function calcMatchProb(team1, team2) {
  const t1 = TEAMS[team1] || { strength: 60, form: 60 };
  const t2 = TEAMS[team2] || { strength: 60, form: 60 };
  const s1 = (t1.strength * 0.6) + (t1.form * 0.4);
  const s2 = (t2.strength * 0.6) + (t2.form * 0.4);
  const total = s1 + s2;
  const p1 = Math.round((s1 / total) * 100);
  const draw = Math.round(Math.min(30, (100 - Math.abs(p1 - 50)) * 0.4));
  const p2 = 100 - p1 - draw;
  return { p1: Math.max(5, p1), draw: Math.max(5, draw), p2: Math.max(5, p2) };
}

function simulateGroup(groupTeams) {
  const standings = {};
  groupTeams.forEach(t => { standings[t] = { pts: 0, gf: 0, ga: 0, played: 0, wins: 0 }; });

  for (let i = 0; i < groupTeams.length; i++) {
    for (let j = i + 1; j < groupTeams.length; j++) {
      const t1 = groupTeams[i];
      const t2 = groupTeams[j];
      const { p1, draw } = calcMatchProb(t1, t2);
      const rand = Math.random() * 100;
      if (rand < p1) {
        standings[t1].pts += 3; standings[t1].wins++;
        standings[t1].gf += 2; standings[t1].ga += 1;
        standings[t2].gf += 1; standings[t2].ga += 2;
      } else if (rand < p1 + draw) {
        standings[t1].pts += 1; standings[t2].pts += 1;
        standings[t1].gf += 1; standings[t1].ga += 1;
        standings[t2].gf += 1; standings[t2].ga += 1;
      } else {
        standings[t2].pts += 3; standings[t2].wins++;
        standings[t2].gf += 2; standings[t2].ga += 1;
        standings[t1].gf += 1; standings[t1].ga += 2;
      }
      standings[t1].played++; standings[t2].played++;
    }
  }

  return Object.entries(standings)
    .sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga))
    .map(([name, stats]) => ({ name, ...stats }));
}

function monteCarloWC(iterations = 10000) {
  const results = {};
  Object.keys(TEAMS).forEach(t => {
    results[t] = { r16: 0, qf: 0, sf: 0, final: 0, winner: 0 };
  });

  for (let iter = 0; iter < iterations; iter++) {
    const qualifiers = {};
    
    // Phase de groupes
    Object.entries(GROUPS).forEach(([group, teams]) => {
      const standing = simulateGroup(teams);
      qualifiers[`${group}1`] = standing[0]?.name;
      qualifiers[`${group}2`] = standing[1]?.name;
    });

    // 8e de finale
    const r16Pairs = [
      ['A1', 'B2'], ['C1', 'D2'], ['E1', 'F2'], ['G1', 'H2'],
      ['B1', 'A2'], ['D1', 'C2'], ['F1', 'E2'], ['H1', 'G2'],
    ];

    const qfTeams = r16Pairs.map(([k1, k2]) => {
      const t1 = qualifiers[k1];
      const t2 = qualifiers[k2];
      if (!t1 || !t2) return t1 || t2;
      if (results[t1]) results[t1].r16++;
      if (results[t2]) results[t2].r16++;
      const { p1 } = calcMatchProb(t1, t2);
      return Math.random() * 100 < p1 ? t1 : t2;
    });

    // Quarts
    const sfTeams = [];
    for (let i = 0; i < qfTeams.length; i += 2) {
      const t1 = qfTeams[i], t2 = qfTeams[i+1];
      if (!t1 || !t2) { sfTeams.push(t1 || t2); continue; }
      if (results[t1]) results[t1].qf++;
      if (results[t2]) results[t2].qf++;
      const { p1 } = calcMatchProb(t1, t2);
      sfTeams.push(Math.random() * 100 < p1 ? t1 : t2);
    }

    // Demies
    const finalists = [];
    for (let i = 0; i < sfTeams.length; i += 2) {
      const t1 = sfTeams[i], t2 = sfTeams[i+1];
      if (!t1 || !t2) { finalists.push(t1 || t2); continue; }
      if (results[t1]) results[t1].sf++;
      if (results[t2]) results[t2].sf++;
      const { p1 } = calcMatchProb(t1, t2);
      finalists.push(Math.random() * 100 < p1 ? t1 : t2);
    }

    // Finale
    if (finalists[0] && finalists[1]) {
      if (results[finalists[0]]) results[finalists[0]].final++;
      if (results[finalists[1]]) results[finalists[1]].final++;
      const { p1 } = calcMatchProb(finalists[0], finalists[1]);
      const winner = Math.random() * 100 < p1 ? finalists[0] : finalists[1];
      if (results[winner]) results[winner].winner++;
    }
  }

  // Convertir en pourcentages
  return Object.entries(results).map(([name, r]) => ({
    name,
    flag: TEAMS[name]?.flag || '🌍',
    odds: TEAMS[name]?.odds || 100,
    winner: Math.round((r.winner / iterations) * 100),
    finalist: Math.round((r.final / iterations) * 100),
    semifinal: Math.round((r.sf / iterations) * 100),
    quarterfinal: Math.round((r.qf / iterations) * 100),
    r16: Math.round((r.r16 / iterations) * 100),
    kairosIndex: Math.min(1000, Math.round((r.winner / iterations) * 5000 + 300)),
  })).sort((a, b) => b.winner - a.winner);
}

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: "'Space Mono', monospace" },
  shell: { maxWidth: 430, margin: '0 auto', minHeight: '100vh' },
  header: { padding: '16px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { padding: '0 16px 100px' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  label: { color: '#4a5568', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  tab: (active) => ({ flex: 1, background: active ? '#00FFB220' : 'transparent', border: `1px solid ${active ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '8px 4px', color: active ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 1, textTransform: 'uppercase' }),
};

export default function WorldCup() {
  const [tab, setTab] = useState('predictions');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [groupStandings, setGroupStandings] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  const runSimulation = () => {
    setLoading(true);
    setTimeout(() => {
      const results = monteCarloWC(10000);
      setPredictions(results);

      // Calculer classements de groupe
      const standings = {};
      Object.entries(GROUPS).forEach(([group, teams]) => {
        const s = simulateGroup(teams);
        standings[group] = s;
      });
      setGroupStandings(standings);
      setSimulated(true);
      setLoading(false);
    }, 100);
  };

  const getColor = (pct) => {
    if (pct >= 20) return '#00FFB2';
    if (pct >= 10) return '#7FFF00';
    if (pct >= 5) return '#FFD700';
    if (pct >= 2) return '#FF8C00';
    return '#FF4D6D';
  };

  const renderPredictions = () => (
    <div>
      {!simulated ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>WORLD CUP 2026 PREDICTOR</div>
          <div style={{ color: '#4a5568', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
            Monte Carlo — 10 000 simulations<br />
            32 nations · 8 groupes · 64 matchs
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, border: '3px solid #1e2a40', borderTop: '3px solid #00FFB2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ color: '#4a5568', fontSize: 11, letterSpacing: 2 }}>SIMULATION EN COURS...</div>
            </div>
          ) : (
            <button style={S.btn} onClick={runSimulation}>⚡ LANCER LA SIMULATION</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginTop: 16 }}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🎲 10 000 SIMULATIONS TERMINÉES</div>
            <div style={{ color: '#4a5568', fontSize: 11 }}>Probabilités basées sur FIFA ranking + forme</div>
          </div>

          {/* Top 5 favoris */}
          <div style={{ color: '#4a5568', fontSize: 10, letterSpacing: 3, margin: '16px 0 8px' }}>TOP FAVORIS</div>
          {predictions.slice(0, 5).map((t, i) => (
            <div key={t.name} style={{ ...S.card, cursor: 'pointer', borderColor: i === 0 ? '#FFD70044' : '#1e2a40' }} onClick={() => setSelectedTeam(selectedTeam === t.name ? null : t.name)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{t.flag} {t.name}</div>
                    <div style={{ color: '#4a5568', fontSize: 10 }}>Cote Unibet : @{t.odds}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: getColor(t.winner), fontWeight: 900, fontSize: 22 }}>{t.winner}%</div>
                  <div style={{ color: '#4a5568', fontSize: 9 }}>VAINQUEUR</div>
                </div>
              </div>

              {selectedTeam === t.name && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                  {[['Vainqueur', t.winner, '#00FFB2'], ['Finaliste', t.finalist, '#7FFF00'], ['1/2', t.semifinal, '#FFD700'], ['1/4', t.quarterfinal, '#FF8C00']].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ background: '#07090f', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ color: col, fontWeight: 700, fontSize: 16 }}>{val}%</div>
                      <div style={{ color: '#4a5568', fontSize: 8, marginTop: 2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tableau complet */}
          <div style={{ color: '#4a5568', fontSize: 10, letterSpacing: 3, margin: '16px 0 8px' }}>CLASSEMENT COMPLET</div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              {['Équipe', 'Vainq.', 'Final.', '1/2', '1/4'].map(h => (
                <div key={h} style={{ color: '#4a5568', fontSize: 9, letterSpacing: 1, textAlign: h === 'Équipe' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {predictions.map((t, i) => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '6px 0', borderTop: '1px solid #1e2a40', alignItems: 'center' }}>
                <div style={{ color: '#e2e8f0', fontSize: 11 }}>{t.flag} {t.name}</div>
                <div style={{ color: getColor(t.winner), fontWeight: 700, fontSize: 11, textAlign: 'right' }}>{t.winner}%</div>
                <div style={{ color: getColor(t.finalist/2), fontSize: 11, textAlign: 'right' }}>{t.finalist}%</div>
                <div style={{ color: '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.semifinal}%</div>
                <div style={{ color: '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.quarterfinal}%</div>
              </div>
            ))}
          </div>

          <button style={{ ...S.btn, background: 'transparent', color: '#00FFB2', border: '1px solid #00FFB244', marginTop: 8 }} onClick={runSimulation}>
            🔄 RELANCER LA SIMULATION
          </button>
        </>
      )}
    </div>
  );

  const renderGroups = () => (
    <div style={{ paddingTop: 16 }}>
      {Object.entries(GROUPS).map(([group, teams]) => {
        const standing = groupStandings[group];
        return (
          <div key={group} style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: 2 }}>GROUPE {group}</div>
            {teams.map((team, i) => {
              const t = TEAMS[team];
              const st = standing?.find(s => s.name === team);
              const prob = calcMatchProb(team, teams[i === 0 ? 1 : 0]);
              return (
                <div key={team} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < teams.length-1 ? '1px solid #1e2a40' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{t?.flag || '🌍'}</span>
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{team}</div>
                      <div style={{ color: '#4a5568', fontSize: 9 }}>FIFA #{t?.fifa || '?'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: getColor(t?.strength / 10 || 5), fontWeight: 700, fontSize: 13 }}>
                      {st ? `${st.pts} pts` : `Force ${t?.strength || 60}`}
                    </div>
                    {st && <div style={{ color: '#4a5568', fontSize: 9 }}>{st.gf}-{st.ga} buts</div>}
                  </div>
                </div>
              );
            })}
            {standing && (
              <div style={{ marginTop: 8, padding: '6px 8px', background: '#07090f', borderRadius: 8 }}>
                <div style={{ color: '#00FFB2', fontSize: 10 }}>🏆 Qualification prévue : {standing[0]?.name} · {standing[1]?.name}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderValueBets = () => (
    <div style={{ paddingTop: 16 }}>
      <div style={{ ...S.card, background: '#FFD70015', border: '1px solid #FFD70044' }}>
        <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>💡 VALUE BETS COUPE DU MONDE</div>
        <div style={{ color: '#4a5568', fontSize: 11, lineHeight: 1.6 }}>Comparaison probabilités KAIROS vs cotes Unibet</div>
      </div>

      {simulated && predictions.slice(0, 10).map(t => {
        const bookmakerProb = Math.round(100 / t.odds);
        const kairosProb = t.winner;
        const value = kairosProb - bookmakerProb;
        const isValue = value > 2;

        return (
          <div key={t.name} style={{ ...S.card, borderColor: isValue ? '#00FFB244' : '#1e2a40' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{t.flag} {t.name}</div>
                <div style={{ color: '#4a5568', fontSize: 10 }}>Vainqueur @{t.odds}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {isValue ? (
                  <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>🔥 VALUE +{value}%</div>
                ) : (
                  <div style={{ color: '#FF4D6D', fontSize: 12 }}>Pas de value</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div><div style={S.label}>Bookmaker</div><div style={{ color: '#4a5568', fontWeight: 700, fontFamily: 'monospace' }}>{bookmakerProb}%</div></div>
              <div><div style={S.label}>KAIROS</div><div style={{ color: '#00FFB2', fontWeight: 700, fontFamily: 'monospace' }}>{kairosProb}%</div></div>
              <div><div style={S.label}>Différence</div><div style={{ color: isValue ? '#00FFB2' : '#FF4D6D', fontWeight: 700, fontFamily: 'monospace' }}>{value > 0 ? '+' : ''}{value}%</div></div>
            </div>
          </div>
        );
      })}

      {!simulated && (
        <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ color: '#4a5568', fontSize: 13 }}>Lance d'abord la simulation !</div>
          <button style={{ ...S.btn, marginTop: 12 }} onClick={() => { setTab('predictions'); runSimulation(); }}>⚡ SIMULER</button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>KAIROS — World Cup 2026 Predictor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>🏆 WORLD CUP 2026</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 3, textTransform: 'uppercase' }}>KAIROS PREDICTOR</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none', letterSpacing: 1 }}>← KAIROS</a>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
            {[['predictions', '🎲 Prédictions'], ['groups', '⚽ Groupes'], ['value', '💰 Value Bets']].map(([id, label]) => (
              <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          <div style={S.scroll}>
            {tab === 'predictions' && renderPredictions()}
            {tab === 'groups' && renderGroups()}
            {tab === 'value' && renderValueBets()}
          </div>
        </div>
      </div>
    </>
  );
}
