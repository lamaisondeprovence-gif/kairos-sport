import { useState, useEffect } from 'react';
import Head from 'next/head';

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: 'monospace' },
  shell: { maxWidth: 430, margin: '0 auto' },
  header: { padding: '14px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 2 },
  tab: (a) => ({ flex: 1, background: a ? '#00FFB220' : 'transparent', border: `1px solid ${a ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '7px 2px', color: a ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 9, fontWeight: a ? 700 : 400, letterSpacing: 1, textTransform: 'uppercase' }),
  label: { color: '#4a5568', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
};

// Historique local enrichi
const defaultHistory = [
  { id: 1, date: '06/06/2026', home: 'Portugal', away: 'Chili', prediction: 'home', result: 'home', kairosIndex: 550, odds: 1.68, stake: 20, correct: true },
  { id: 2, date: '06/06/2026', home: 'Allemagne', away: 'USA', prediction: 'home', result: 'home', kairosIndex: 450, odds: 1.58, stake: 20, correct: true },
  { id: 3, date: '07/06/2026', home: 'Vegas Golden Knights', away: 'Carolina Hurricanes', prediction: 'home', result: 'draw', kairosIndex: 573, odds: 2.48, stake: 50, correct: false },
];

export default function CoachPage() {
  const [tab, setTab] = useState('learning');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualForm, setManualForm] = useState({ home: '', away: '', prediction: 'home', result: 'home', kairosIndex: 500, odds: 2.0, stake: 20 });

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('kairos_coach_history');
      const local = saved ? JSON.parse(saved) : [];
      setHistory([...defaultHistory, ...local]);
    } catch { setHistory(defaultHistory); }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/results-checker');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {}
  };

  const checkResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/results-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check' }) });
      const data = await res.json();
      if (data.success) { alert(`✅ ${data.updated} résultats mis à jour !`); loadStats(); }
    } catch {}
    setLoading(false);
  };

  const addManual = async () => {
    setLoading(true);
    try {
      await fetch('/api/results-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual', ...manualForm, probability: Math.round(100 / manualForm.odds) }),
      });
      const newEntry = { ...manualForm, id: Date.now(), date: new Date().toLocaleDateString('fr-BE'), correct: manualForm.prediction === manualForm.result };
      const updated = [newEntry, ...history];
      setHistory(updated);
      const local = updated.filter(h => !defaultHistory.find(d => d.id === h.id));
      localStorage.setItem('kairos_coach_history', JSON.stringify(local));
      setManualForm({ home: '', away: '', prediction: 'home', result: 'home', kairosIndex: 500, odds: 2.0, stake: 20 });
      loadStats();
    } catch {}
    setLoading(false);
  };

  // Calcul stats locales
  const total = history.length;
  const correct = history.filter(h => h.correct).length;
  const correctRate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalStake = history.reduce((a, h) => a + (h.stake || 0), 0);
  const totalGain = history.filter(h => h.correct).reduce((a, h) => a + ((h.stake || 0) * (h.odds || 2)), 0);
  const roi = totalStake > 0 ? Math.round(((totalGain - totalStake) / totalStake) * 100) : 0;

  // Stats par plage d'indice
  const byRange = {};
  ['<500', '500-599', '600-699', '700-799', '800-899', '900+'].forEach(r => { byRange[r] = { total: 0, correct: 0 }; });
  history.forEach(h => {
    const idx = h.kairosIndex || 0;
    const range = idx >= 900 ? '900+' : idx >= 800 ? '800-899' : idx >= 700 ? '700-799' : idx >= 600 ? '600-699' : idx >= 500 ? '500-599' : '<500';
    byRange[range].total++;
    if (h.correct) byRange[range].correct++;
  });

  // Insights automatiques
  const insights = [];
  if (correctRate >= 60) insights.push({ icon: '✅', color: '#00FFB2', msg: `Taux de réussite excellent : ${correctRate}%` });
  else if (correctRate < 45) insights.push({ icon: '⚠️', color: '#FF8C00', msg: `Taux ${correctRate}% — revoir la stratégie` });
  if (roi > 0) insights.push({ icon: '💰', color: '#00FFB2', msg: `ROI positif : +${roi}% — continue !` });
  else insights.push({ icon: '📊', color: '#FF4D6D', msg: `ROI négatif : ${roi}% — mise plus petite` });

  const nhlLoss = history.find(h => h.home === 'Vegas Golden Knights' && !h.correct);
  if (nhlLoss) insights.push({ icon: '🏒', color: '#FF8C00', msg: 'NHL Playoffs : inclure les prolongations dans l\'analyse' });

  const lowIdxWrong = history.filter(h => (h.kairosIndex || 0) < 500 && !h.correct);
  if (lowIdxWrong.length >= 2) insights.push({ icon: '🔴', color: '#FF4D6D', msg: `${lowIdxWrong.length} erreurs sur indices <500 — éviter ces matchs` });

  const renderLearning = () => (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16, marginBottom: 12 }}>
        {[['Prédictions', total, '#e2e8f0'], ['Réussite', `${correctRate}%`, correctRate >= 55 ? '#00FFB2' : '#FF4D6D'], ['ROI', `${roi > 0 ? '+' : ''}${roi}%`, roi > 0 ? '#00FFB2' : '#FF4D6D']].map(([lbl, val, col]) => (
          <div key={lbl} style={{ ...S.card, textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ color: col, fontWeight: 900, fontSize: 20 }}>{val}</div>
            <div style={{ color: '#4a5568', fontSize: 9, marginTop: 2, letterSpacing: 1 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Bankroll */}
      <div style={{ ...S.card, background: roi > 0 ? '#00FFB210' : '#FF4D6D10', border: `1px solid ${roi > 0 ? '#00FFB244' : '#FF4D6D44'}` }}>
        <div style={{ color: roi > 0 ? '#00FFB2' : '#FF4D6D', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>💰 BANKROLL</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[['Misé total', `${totalStake}€`, '#4a5568'], ['Récupéré', `${Math.round(totalGain)}€`, '#FFD700'], ['Bénéfice', `${roi > 0 ? '+' : ''}${Math.round(totalGain - totalStake)}€`, roi > 0 ? '#00FFB2' : '#FF4D6D']].map(([lbl, val, col]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ color: col, fontWeight: 700, fontSize: 16 }}>{val}</div>
              <div style={{ color: '#4a5568', fontSize: 8, marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights KAIROS */}
      <div style={{ ...S.card, background: '#FFD70010', border: '1px solid #FFD70044' }}>
        <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🧠 APPRENTISSAGE KAIROS</div>
        {insights.map((ins, i) => (
          <div key={i} style={{ color: ins.color, fontSize: 12, padding: '5px 0', borderBottom: i < insights.length-1 ? '1px solid #1e2a40' : 'none' }}>
            {ins.icon} {ins.msg}
          </div>
        ))}
      </div>

      {/* Stats par indice */}
      <div style={S.card}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📊 RÉUSSITE PAR INDICE KAIROS</div>
        {Object.entries(byRange).filter(([, v]) => v.total > 0).map(([range, data]) => {
          const rate = Math.round((data.correct / data.total) * 100);
          const color = rate >= 60 ? '#00FFB2' : rate >= 45 ? '#FFD700' : '#FF4D6D';
          return (
            <div key={range} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#e2e8f0', fontSize: 11 }}>Indice {range}</span>
                <span style={{ color, fontWeight: 700, fontSize: 11 }}>{rate}% ({data.correct}/{data.total})</span>
              </div>
              <div style={{ background: '#07090f', borderRadius: 4, height: 6 }}>
                <div style={{ background: color, width: `${rate}%`, height: 6, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      <button style={S.btn} onClick={checkResults} disabled={loading}>
        {loading ? 'VÉRIFICATION...' : '🔄 VÉRIFIER LES RÉSULTATS'}
      </button>
    </div>
  );

  const renderHistory = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      {history.map((h, i) => (
        <div key={h.id || i} style={{ ...S.card, borderColor: h.correct ? '#00FFB244' : '#FF4D6D44' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{h.home} vs {h.away}</div>
              <div style={{ color: '#4a5568', fontSize: 10, marginTop: 2 }}>{h.date} · @{h.odds} · {h.stake}€</div>
              <div style={{ color: '#4a5568', fontSize: 10 }}>Indice : {h.kairosIndex}/1000</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: h.correct ? '#00FFB2' : '#FF4D6D', fontWeight: 700, fontSize: 18 }}>
                {h.correct ? '✅' : '❌'}
              </div>
              <div style={{ color: h.correct ? '#00FFB2' : '#FF4D6D', fontSize: 11, fontWeight: 700 }}>
                {h.correct ? `+${Math.round((h.stake || 0) * (h.odds || 2) - (h.stake || 0))}€` : `-${h.stake || 0}€`}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <span style={{ background: '#07090f', borderRadius: 6, padding: '3px 8px', color: '#4a5568', fontSize: 10 }}>
              Prédit : {h.prediction === 'home' ? h.home : h.prediction === 'away' ? h.away : 'Nul'}
            </span>
            <span style={{ background: '#07090f', borderRadius: 6, padding: '3px 8px', color: h.correct ? '#00FFB2' : '#FF4D6D', fontSize: 10 }}>
              Résultat : {h.result === 'home' ? h.home : h.result === 'away' ? h.away : 'Nul'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderManual = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244' }}>
        <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>➕ AJOUTER UN RÉSULTAT</div>
        <div style={{ color: '#4a5568', fontSize: 10 }}>Enregistre tes paris pour que KAIROS apprenne</div>
      </div>

      {[['Équipe domicile', 'home', 'text'], ['Équipe extérieur', 'away', 'text'], ['Cote', 'odds', 'number'], ['Mise (€)', 'stake', 'number'], ['Indice KAIROS', 'kairosIndex', 'number']].map(([lbl, key, type]) => (
        <div key={key} style={S.card}>
          <div style={S.label}>{lbl}</div>
          <input value={manualForm[key]} onChange={e => setManualForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
            type={type} style={{ background: '#07090f', border: '1px solid #1e2a40', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13, width: '100%', outline: 'none' }} />
        </div>
      ))}

      <div style={S.card}>
        <div style={S.label}>Prédiction KAIROS</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['home', '1 Domicile'], ['draw', 'X Nul'], ['away', '2 Extérieur']].map(([val, lbl]) => (
            <button key={val} onClick={() => setManualForm(f => ({ ...f, prediction: val }))}
              style={{ flex: 1, background: manualForm.prediction === val ? '#00FFB220' : '#07090f', border: `1px solid ${manualForm.prediction === val ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '8px 4px', color: manualForm.prediction === val ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 10 }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.label}>Vrai résultat</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['home', '1 Domicile'], ['draw', 'X Nul'], ['away', '2 Extérieur']].map(([val, lbl]) => (
            <button key={val} onClick={() => setManualForm(f => ({ ...f, result: val }))}
              style={{ flex: 1, background: manualForm.result === val ? '#FF6B0020' : '#07090f', border: `1px solid ${manualForm.result === val ? '#FF6B00' : '#1e2a40'}`, borderRadius: 8, padding: '8px 4px', color: manualForm.result === val ? '#FF6B00' : '#4a5568', cursor: 'pointer', fontSize: 10 }}>{lbl}</button>
          ))}
        </div>
      </div>

      <button style={S.btn} onClick={addManual} disabled={loading || !manualForm.home || !manualForm.away}>
        {loading ? 'ENREGISTREMENT...' : '💾 ENREGISTRER ET APPRENDRE'}
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <title>KAIROS — Apprentissage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>🧠 APPRENTISSAGE</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 2 }}>KAIROS APPREND DE SES ERREURS</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none' }}>← KAIROS</a>
          </div>

          <div style={{ padding: '8px 16px', display: 'flex', gap: 4 }}>
            {[['learning','📊 Stats'],['history','📋 Historique'],['manual','➕ Ajouter']].map(([id, lbl]) => (
              <button key={id} style={S.tab(tab===id)} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {tab === 'learning' && renderLearning()}
          {tab === 'history' && renderHistory()}
          {tab === 'manual' && renderManual()}
        </div>
      </div>
    </>
  );
}
