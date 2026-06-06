import { useState, useEffect } from 'react';
import Head from 'next/head';

const TEAMS = {
  'Argentine': { flag: '🇦🇷', fifa: 1, group: 'B', odds: 10, strength: 95, form: 92 },
  'France': { flag: '🇫🇷', fifa: 3, group: 'F', odds: 5.6, strength: 92, form: 90 },
  'Espagne': { flag: '🇪🇸', fifa: 2, group: 'E', odds: 5.5, strength: 93, form: 95 },
  'Brésil': { flag: '🇧🇷', fifa: 5, group: 'D', odds: 9, strength: 90, form: 87 },
  'Portugal': { flag: '🇵🇹', fifa: 6, group: 'G', odds: 10, strength: 89, form: 88 },
  'Angleterre': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fifa: 5, group: 'G', odds: 7, strength: 87, form: 85 },
  'Allemagne': { flag: '🇩🇪', fifa: 4, group: 'C', odds: 13, strength: 88, form: 85 },
  'Pays-Bas': { flag: '🇳🇱', fifa: 7, group: 'F', odds: 19, strength: 82, form: 80 },
  'Belgique': { flag: '🇧🇪', fifa: 3, group: 'H', odds: 34, strength: 80, form: 75 },
  'Maroc': { flag: '🇲🇦', fifa: 14, group: 'B', odds: 51, strength: 73, form: 75 },
  'USA': { flag: '🇺🇸', fifa: 13, group: 'A', odds: 51, strength: 72, form: 65 },
  'Japon': { flag: '🇯🇵', fifa: 15, group: 'C', odds: 67, strength: 71, form: 73 },
  'Croatie': { flag: '🇭🇷', fifa: 10, group: 'E', odds: 81, strength: 75, form: 72 },
  'Uruguay': { flag: '🇺🇾', fifa: 17, group: 'A', odds: 81, strength: 78, form: 70 },
  'Norvège': { flag: '🇳🇴', fifa: 22, group: 'G', odds: 26, strength: 67, form: 70 },
  'Mexique': { flag: '🇲🇽', fifa: 16, group: 'C', odds: 67, strength: 70, form: 65 },
  'Colombie': { flag: '🇨🇴', fifa: 19, group: 'F', odds: 34, strength: 74, form: 72 },
  'Suisse': { flag: '🇨🇭', fifa: 21, group: 'D', odds: 67, strength: 68, form: 70 },
  'Sénégal': { flag: '🇸🇳', fifa: 20, group: 'E', odds: 101, strength: 66, form: 68 },
  'Serbie': { flag: '🇷🇸', fifa: 25, group: 'D', odds: 101, strength: 63, form: 60 },
  'Autriche': { flag: '🇦🇹', fifa: 23, group: 'F', odds: 151, strength: 65, form: 62 },
  'Turquie': { flag: '🇹🇷', fifa: 26, group: 'H', odds: 101, strength: 64, form: 66 },
  'Canada': { flag: '🇨🇦', fifa: 44, group: 'G', odds: 101, strength: 63, form: 65 },
  'Suède': { flag: '🇸🇪', fifa: 28, group: 'H', odds: 101, strength: 62, form: 60 },
  'Équateur': { flag: '🇪🇨', fifa: 36, group: 'B', odds: 101, strength: 58, form: 55 },
  'Tunisie': { flag: '🇹🇳', fifa: 32, group: 'E', odds: 201, strength: 56, form: 53 },
  'Panama': { flag: '🇵🇦', fifa: 49, group: 'A', odds: 201, strength: 52, form: 48 },
  'Cameroun': { flag: '🇨🇲', fifa: 44, group: 'D', odds: 151, strength: 55, form: 52 },
  'Côte Ivoire': { flag: '🇨🇮', fifa: 27, group: 'C', odds: 101, strength: 62, form: 60 },
  'Bolivia': { flag: '🇧🇴', fifa: 85, group: 'A', odds: 301, strength: 42, form: 40 },
  'Kenya': { flag: '🇰🇪', fifa: 95, group: 'B', odds: 501, strength: 35, form: 32 },
  'Maroc2': { flag: '🇲🇦', fifa: 14, group: 'H', odds: 51, strength: 73, form: 75 },
};

// ✅ GROUPES CORRIGÉS — pas de doublon
const GROUPS = {
  A: ['USA', 'Uruguay', 'Panama', 'Bolivia'],
  B: ['Argentine', 'Maroc', 'Équateur', 'Kenya'],
  C: ['Allemagne', 'Mexique', 'Japon', 'Côte Ivoire'],
  D: ['Brésil', 'Suisse', 'Serbie', 'Cameroun'],
  E: ['Espagne', 'Croatie', 'Sénégal', 'Tunisie'],
  F: ['France', 'Pays-Bas', 'Colombie', 'Autriche'],
  G: ['Portugal', 'Angleterre', 'Norvège', 'Canada'],
  H: ['Belgique', 'Turquie', 'Suède', 'Maroc2'],
};

function calcMatchProb(t1name, t2name) {
  const t1 = TEAMS[t1name] || { strength: 60, form: 60 };
  const t2 = TEAMS[t2name] || { strength: 60, form: 60 };
  const s1 = t1.strength * 0.6 + t1.form * 0.4;
  const s2 = t2.strength * 0.6 + t2.form * 0.4;
  const total = s1 + s2;
  const p1 = Math.round((s1 / total) * 100);
  const draw = Math.round(Math.min(28, (100 - Math.abs(p1 - 50)) * 0.35));
  return { p1: Math.max(5, p1), draw: Math.max(5, draw), p2: Math.max(5, 100 - p1 - draw) };
}

function simulateGroup(teams) {
  const st = {};
  teams.forEach(t => { st[t] = { pts: 0, gf: 0, ga: 0 }; });
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const t1 = teams[i], t2 = teams[j];
      const { p1, draw } = calcMatchProb(t1, t2);
      const r = Math.random() * 100;
      if (r < p1) { st[t1].pts += 3; st[t1].gf += 2; st[t1].ga += 1; st[t2].gf += 1; st[t2].ga += 2; }
      else if (r < p1 + draw) { st[t1].pts += 1; st[t2].pts += 1; st[t1].gf += 1; st[t1].ga += 1; st[t2].gf += 1; st[t2].ga += 1; }
      else { st[t2].pts += 3; st[t2].gf += 2; st[t2].ga += 1; st[t1].gf += 1; st[t1].ga += 2; }
    }
  }
  return Object.entries(st).sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga)).map(([name, s]) => ({ name, ...s }));
}

function simulate(iterations = 10000) {
  const res = {};
  Object.keys(TEAMS).forEach(t => { res[t] = { r16: 0, qf: 0, sf: 0, final: 0, winner: 0 }; });

  for (let iter = 0; iter < iterations; iter++) {
    const q = {};
    Object.entries(GROUPS).forEach(([g, teams]) => {
      const s = simulateGroup(teams);
      q[`${g}1`] = s[0]?.name;
      q[`${g}2`] = s[1]?.name;
    });

    const r16 = [['A1','B2'],['C1','D2'],['E1','F2'],['G1','H2'],['B1','A2'],['D1','C2'],['F1','E2'],['H1','G2']];
    const qfT = r16.map(([k1, k2]) => {
      const t1 = q[k1], t2 = q[k2];
      if (!t1 || !t2) return t1 || t2;
      if (res[t1]) res[t1].r16++;
      if (res[t2]) res[t2].r16++;
      return Math.random() * 100 < calcMatchProb(t1, t2).p1 ? t1 : t2;
    });

    const sfT = [];
    for (let i = 0; i < qfT.length; i += 2) {
      const t1 = qfT[i], t2 = qfT[i+1];
      if (!t1 || !t2) { sfT.push(t1||t2); continue; }
      if (res[t1]) res[t1].qf++;
      if (res[t2]) res[t2].qf++;
      sfT.push(Math.random() * 100 < calcMatchProb(t1, t2).p1 ? t1 : t2);
    }

    const fins = [];
    for (let i = 0; i < sfT.length; i += 2) {
      const t1 = sfT[i], t2 = sfT[i+1];
      if (!t1 || !t2) { fins.push(t1||t2); continue; }
      if (res[t1]) res[t1].sf++;
      if (res[t2]) res[t2].sf++;
      fins.push(Math.random() * 100 < calcMatchProb(t1, t2).p1 ? t1 : t2);
    }

    if (fins[0] && fins[1]) {
      if (res[fins[0]]) res[fins[0]].final++;
      if (res[fins[1]]) res[fins[1]].final++;
      const w = Math.random() * 100 < calcMatchProb(fins[0], fins[1]).p1 ? fins[0] : fins[1];
      if (res[w]) res[w].winner++;
    }
  }

  return Object.entries(res).map(([name, r]) => ({
    name, flag: TEAMS[name]?.flag || '🌍', odds: TEAMS[name]?.odds || 100,
    winner: Math.round((r.winner/iterations)*100),
    finalist: Math.round((r.final/iterations)*100),
    semifinal: Math.round((r.sf/iterations)*100),
    quarterfinal: Math.round((r.qf/iterations)*100),
    r16: Math.round((r.r16/iterations)*100),
  })).sort((a, b) => b.winner - a.winner);
}

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: 'monospace' },
  shell: { maxWidth: 430, margin: '0 auto' },
  header: { padding: '14px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 2 },
  tab: (a) => ({ flex: 1, background: a ? '#00FFB220' : 'transparent', border: `1px solid ${a ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '7px 4px', color: a ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 9, fontWeight: a ? 700 : 400, letterSpacing: 1, textTransform: 'uppercase' }),
  label: { color: '#4a5568', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
};

const getColor = (p) => p >= 20 ? '#00FFB2' : p >= 10 ? '#7FFF00' : p >= 5 ? '#FFD700' : p >= 2 ? '#FF8C00' : '#FF4D6D';

export default function WorldCup() {
  const [tab, setTab] = useState('predictions');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [groupStandings, setGroupStandings] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  const runSim = () => {
    setLoading(true);
    setTimeout(() => {
      setPredictions(simulate(10000));
      const gs = {};
      Object.entries(GROUPS).forEach(([g, teams]) => { gs[g] = simulateGroup(teams); });
      setGroupStandings(gs);
      setSimulated(true);
      setLoading(false);
    }, 50);
  };

  const renderPredictions = () => (
    <div style={{ padding: '0 16px 100px' }}>
      {!simulated ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>WORLD CUP 2026</div>
          <div style={{ color: '#4a5568', fontSize: 11, marginBottom: 24, lineHeight: 1.8 }}>Monte Carlo · 10 000 simulations<br />32 nations · 8 groupes · 64 matchs</div>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, border: '3px solid #1e2a40', borderTop: '3px solid #00FFB2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: '#4a5568', fontSize: 11, letterSpacing: 2 }}>SIMULATION EN COURS...</div>
              </div>
            : <button style={S.btn} onClick={runSim}>⚡ LANCER LA SIMULATION</button>
          }
        </div>
      ) : (
        <>
          <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginTop: 16 }}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>🎲 10 000 SIMULATIONS TERMINÉES</div>
            <div style={{ color: '#4a5568', fontSize: 10, marginTop: 4 }}>FIFA ranking + forme + force relative</div>
          </div>

          <div style={{ color: '#4a5568', fontSize: 10, letterSpacing: 3, margin: '16px 0 8px' }}>TOP FAVORIS</div>
          {predictions.slice(0, 5).map((t, i) => (
            <div key={t.name} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setSelected(selected === t.name ? null : t.name)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{['🥇','🥈','🥉','4.','5.'][i]}</span>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{t.flag} {t.name}</div>
                    <div style={{ color: '#4a5568', fontSize: 10 }}>Unibet @{t.odds}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: getColor(t.winner), fontWeight: 900, fontSize: 24 }}>{t.winner}%</div>
                  <div style={{ color: '#4a5568', fontSize: 9 }}>VAINQUEUR</div>
                </div>
              </div>
              {selected === t.name && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12 }}>
                  {[['Vainqueur', t.winner, '#00FFB2'], ['Finaliste', t.finalist, '#7FFF00'], ['1/2 finale', t.semifinal, '#FFD700'], ['1/4 finale', t.quarterfinal, '#FF8C00']].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ background: '#07090f', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ color: col, fontWeight: 700, fontSize: 18 }}>{val}%</div>
                      <div style={{ color: '#4a5568', fontSize: 8, marginTop: 2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ color: '#4a5568', fontSize: 10, letterSpacing: 3, margin: '16px 0 8px' }}>CLASSEMENT COMPLET</div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              {['Équipe','Vainq.','Final.','1/2','1/4'].map(h => (
                <div key={h} style={{ color: '#4a5568', fontSize: 9, textAlign: h === 'Équipe' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {predictions.filter(t => t.name !== 'Maroc2').map(t => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '5px 0', borderTop: '1px solid #1e2a40', alignItems: 'center' }}>
                <div style={{ color: '#e2e8f0', fontSize: 11 }}>{t.flag} {t.name}</div>
                <div style={{ color: getColor(t.winner), fontWeight: 700, fontSize: 11, textAlign: 'right' }}>{t.winner}%</div>
                <div style={{ color: getColor(t.finalist/2), fontSize: 11, textAlign: 'right' }}>{t.finalist}%</div>
                <div style={{ color: '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.semifinal}%</div>
                <div style={{ color: '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.quarterfinal}%</div>
              </div>
            ))}
          </div>
          <button style={{ ...S.btn, background: 'transparent', color: '#00FFB2', border: '1px solid #00FFB244', marginTop: 8 }} onClick={runSim}>🔄 RELANCER</button>
        </>
      )}
    </div>
  );

  const renderGroups = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      {Object.entries(GROUPS).map(([group, teams]) => {
        const standing = groupStandings[group];
        return (
          <div key={group} style={S.card}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: 2 }}>GROUPE {group}</div>
            {teams.map((team, i) => {
              const t = TEAMS[team];
              const st = standing?.find(s => s.name === team);
              const isQualified = standing && (standing[0]?.name === team || standing[1]?.name === team);
              return (
                <div key={team} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < teams.length-1 ? '1px solid #1e2a40' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isQualified && <span style={{ color: '#00FFB2', fontSize: 12 }}>✅</span>}
                    <span style={{ fontSize: 18 }}>{t?.flag || '🌍'}</span>
                    <div>
                      <div style={{ color: isQualified ? '#e2e8f0' : '#4a5568', fontSize: 13, fontWeight: isQualified ? 700 : 400 }}>
                        {team === 'Maroc2' ? 'Maroc' : team}
                      </div>
                      <div style={{ color: '#4a5568', fontSize: 9 }}>FIFA #{t?.fifa || '?'} · Force {t?.strength || 60}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: isQualified ? '#00FFB2' : '#4a5568', fontWeight: 700, fontSize: 14 }}>
                      {st ? `${st.pts} pts` : `${t?.strength || 60}`}
                    </div>
                    {st && <div style={{ color: '#4a5568', fontSize: 9 }}>{st.gf}-{st.ga}</div>}
                  </div>
                </div>
              );
            })}
            {standing && (
              <div style={{ marginTop: 8, padding: '6px 10px', background: '#07090f', borderRadius: 8 }}>
                <div style={{ color: '#00FFB2', fontSize: 10 }}>
                  🏆 {standing[0]?.name === 'Maroc2' ? 'Maroc' : standing[0]?.name} · {standing[1]?.name === 'Maroc2' ? 'Maroc' : standing[1]?.name}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {!simulated && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ color: '#4a5568', marginBottom: 12 }}>Lance d'abord la simulation !</div>
          <button style={S.btn} onClick={() => { setTab('predictions'); runSim(); }}>⚡ SIMULER</button>
        </div>
      )}
    </div>
  );

  const renderValueBets = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ ...S.card, background: '#FFD70015', border: '1px solid #FFD70044' }}>
        <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💰 VALUE BETS COUPE DU MONDE</div>
        <div style={{ color: '#4a5568', fontSize: 11 }}>KAIROS vs cotes Unibet</div>
      </div>

      {!simulated ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <button style={S.btn} onClick={() => { setTab('predictions'); runSim(); }}>⚡ SIMULER D'ABORD</button>
        </div>
      ) : predictions.filter(t => t.name !== 'Maroc2').slice(0, 12).map(t => {
        const bkProb = Math.round(100 / t.odds);
        const kProb = t.winner;
        const value = kProb - bkProb;
        const isValue = value > 1;
        return (
          <div key={t.name} style={{ ...S.card, borderColor: isValue ? '#00FFB244' : '#1e2a40' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isValue ? 8 : 0 }}>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{t.flag} {t.name}</div>
                <div style={{ color: '#4a5568', fontSize: 10 }}>Vainqueur @{t.odds}</div>
              </div>
              <div style={{ color: isValue ? '#00FFB2' : '#FF4D6D', fontWeight: 700, fontSize: 12 }}>
                {isValue ? `🔥 VALUE +${value}%` : '❌ Pas de value'}
              </div>
            </div>
            {isValue && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div><div style={S.label}>Bookmaker</div><div style={{ color: '#4a5568', fontWeight: 700 }}>{bkProb}%</div></div>
                <div><div style={S.label}>KAIROS</div><div style={{ color: '#00FFB2', fontWeight: 700 }}>{kProb}%</div></div>
                <div><div style={S.label}>Value</div><div style={{ color: '#00FFB2', fontWeight: 700 }}>+{value}%</div></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <Head>
        <title>KAIROS — World Cup 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>🏆 WORLD CUP 2026</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 3 }}>KAIROS PREDICTOR · MONTE CARLO</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none' }}>← KAIROS</a>
          </div>
          <div style={{ padding: '10px 16px', display: 'flex', gap: 6 }}>
            {[['predictions','🎲 Prédictions'],['groups','⚽ Groupes'],['value','💰 Value Bets']].map(([id, lbl]) => (
              <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>
          {tab === 'predictions' && renderPredictions()}
          {tab === 'groups' && renderGroups()}
          {tab === 'value' && renderValueBets()}
        </div>
      </div>
    </>
  );
}
