import { useState, useEffect } from 'react';
import Head from 'next/head';

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: 'monospace' },
  shell: { maxWidth: 430, margin: '0 auto' },
  header: { padding: '14px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  btnGhost: (col='#00FFB2') => ({ background: 'transparent', color: col, border: `1px solid ${col}44`, borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }),
  label: { color: '#4a5568', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
};

const getColor = (rate) => rate >= 60 ? '#00FFB2' : rate >= 50 ? '#FFD700' : rate >= 40 ? '#FF8C00' : '#FF4D6D';

export default function LearningPage() {
  const [phase, setPhase] = useState('idle'); // idle, training, trained, updating
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [weeklyResult, setWeeklyResult] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
    loadConfig();
  }, []);

  const addLog = (msg, type = 'info') => {
    setLog(l => [...l.slice(-20), { msg, type, time: new Date().toLocaleTimeString('fr-BE') }]);
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/self-learning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config' }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setTotalRecords(data.totalRecords);
        if (data.totalRecords > 1000) setPhase('trained');
      }
    } catch {}
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/self-learning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats' }),
      });
      const data = await res.json();
      if (data.success) { setStats(data.adjustments); setTotalRecords(data.totalRecords); }
    } catch {}
  };

  const startTraining = async () => {
    setPhase('training');
    setProgress(0);
    setLog([]);
    addLog('🚀 Démarrage de l\'entraînement sur 10 ans...', 'info');

    // Simulation progression
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return p; }
        return p + Math.random() * 15;
      });
    }, 300);

    addLog('📊 Génération de 10 saisons de données...', 'info');
    addLog('⚽ Serie A · La Liga · Ligue 1 · Bundesliga · Pro League', 'info');

    try {
      const res = await fetch('/api/self-learning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_historical' }),
      });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (data.success) {
        if (data.alreadyExists) {
          addLog(`✅ Données déjà présentes : ${data.message}`, 'success');
        } else {
          addLog(`✅ ${data.inserted?.toLocaleString()} matchs générés !`, 'success');
        }
        addLog(`📈 Précision globale : ${data.adjustments?.globalRate}%`, 'success');
        addLog(`🏠 Avantage domicile : +${data.adjustments?.homeAdvantageBonus} pts`, 'info');

        data.adjustments?.insights?.forEach(ins => addLog(ins.msg, ins.type));

        setConfig({ ...data.adjustments, last_trained: new Date().toISOString() });
        setStats(data.adjustments);
        setTotalRecords(data.inserted || totalRecords);
        setPhase('trained');
        await loadStats();
      }
    } catch (err) {
      clearInterval(interval);
      addLog(`❌ Erreur : ${err.message}`, 'error');
      setPhase('idle');
    }
  };

  const weeklyUpdate = async () => {
    setPhase('updating');
    addLog('🔄 Mise à jour hebdomadaire en cours...', 'info');

    try {
      const res = await fetch('/api/self-learning', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'weekly_update' }),
      });
      const data = await res.json();

      if (data.success) {
        addLog(`✅ ${data.updated} prédictions analysées`, 'success');
        addLog(`📊 Algorithme recalibré`, 'success');
        data.adjustments?.insights?.forEach(ins => addLog(ins.msg, ins.type));
        setWeeklyResult(data);
        await loadStats();
      }
    } catch (err) {
      addLog(`❌ Erreur : ${err.message}`, 'error');
    }

    setPhase('trained');
  };

  const renderIdle = () => (
    <div style={{ padding: '0 16px 100px' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>AUTO-APPRENTISSAGE</div>
        <div style={{ color: '#4a5568', fontSize: 11, marginBottom: 8, lineHeight: 1.8 }}>
          KAIROS va s'entraîner sur<br />
          <span style={{ color: '#00FFB2', fontWeight: 700 }}>10 ans de données fictives</span><br />
          pour calibrer son algorithme
        </div>
        <div style={{ color: '#4a5568', fontSize: 10, marginBottom: 32, lineHeight: 1.6 }}>
          5 championnats · ~15 000 matchs simulés<br />
          Puis mise à jour réelle chaque semaine
        </div>

        <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📋 CE QUE KAIROS VA APPRENDRE</div>
          {[
            '✅ Quelle plage d\'indice est la plus fiable',
            '✅ L\'avantage domicile réel par championnat',
            '✅ Quand faire confiance aux favoris',
            '✅ Détecter les matchs pièges automatiquement',
            '✅ Ajuster les probabilités selon les erreurs passées',
          ].map((item, i) => (
            <div key={i} style={{ color: '#e2e8f0', fontSize: 11, padding: '4px 0' }}>{item}</div>
          ))}
        </div>

        <button style={S.btn} onClick={startTraining}>
          ⚡ LANCER L'ENTRAÎNEMENT
        </button>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div style={{ padding: '0 16px 100px' }}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>ENTRAÎNEMENT EN COURS...</div>

        {/* Barre de progression */}
        <div style={{ background: '#1e2a40', borderRadius: 8, height: 12, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #00FFB2, #7FFF00)', height: 12, borderRadius: 8, width: `${Math.min(100, progress)}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ color: '#00FFB2', fontSize: 14, fontWeight: 700, marginBottom: 24 }}>{Math.round(progress)}%</div>

        {/* Log en temps réel */}
        <div style={{ ...S.card, textAlign: 'left', maxHeight: 300, overflowY: 'auto' }}>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.type === 'success' ? '#00FFB2' : l.type === 'error' ? '#FF4D6D' : '#4a5568', fontSize: 10, padding: '3px 0', display: 'flex', gap: 8 }}>
              <span style={{ color: '#1e2a40', fontSize: 9 }}>{l.time}</span>
              <span>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTrained = () => (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Header succès */}
      <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginTop: 16 }}>
        <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>✅ KAIROS EST ENTRAÎNÉ</div>
        <div style={{ color: '#4a5568', fontSize: 10, marginTop: 4 }}>
          {totalRecords.toLocaleString()} matchs analysés · Algorithme calibré
        </div>
        {config?.last_trained && (
          <div style={{ color: '#4a5568', fontSize: 9, marginTop: 2 }}>
            Dernier entraînement : {new Date(config.last_trained).toLocaleDateString('fr-BE')}
          </div>
        )}
      </div>

      {/* Précision globale */}
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Précision', `${stats.globalRate}%`, getColor(stats.globalRate)],
              ['Matchs', totalRecords.toLocaleString(), '#e2e8f0'],
              ['Domicile', `${stats.homeWinRate}%`, '#FFD700'],
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ ...S.card, textAlign: 'center', padding: '12px 8px' }}>
                <div style={{ color: col, fontWeight: 900, fontSize: 18 }}>{val}</div>
                <div style={{ color: '#4a5568', fontSize: 9, marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Réussite par indice */}
          <div style={S.card}>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              📊 RÉUSSITE PAR INDICE KAIROS
            </div>
            {Object.entries(stats.byIndexRange || {}).map(([range, data]) => (
              <div key={range} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 11 }}>Indice {range}</span>
                  <span style={{ color: getColor(data.rate), fontWeight: 700, fontSize: 11 }}>
                    {data.rate}% ({data.correct}/{data.total})
                  </span>
                </div>
                <div style={{ background: '#07090f', borderRadius: 4, height: 8 }}>
                  <div style={{ background: getColor(data.rate), width: `${data.rate}%`, height: 8, borderRadius: 4, transition: 'width 0.8s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ ...S.card, background: '#FFD70010', border: '1px solid #FFD70044' }}>
            <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>💡 INSIGHTS KAIROS</div>
            {(stats.insights || []).map((ins, i) => (
              <div key={i} style={{ color: ins.type === 'success' ? '#00FFB2' : ins.type === 'warning' ? '#FF8C00' : '#4a5568', fontSize: 11, padding: '5px 0', borderBottom: i < stats.insights.length-1 ? '1px solid #1e2a40' : 'none' }}>
                {ins.msg}
              </div>
            ))}
          </div>

          {/* Ajustements appliqués */}
          {stats.homeAdvantageBonus > 0 && (
            <div style={{ ...S.card, background: '#4169E110', border: '1px solid #4169E144' }}>
              <div style={{ color: '#4169E1', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔧 AJUSTEMENTS APPLIQUÉS</div>
              <div style={{ color: '#e2e8f0', fontSize: 11 }}>
                ✅ Bonus avantage domicile : +{stats.homeAdvantageBonus} pts
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 11, marginTop: 4 }}>
                ✅ Seuil recommandé : Indice ≥ 700
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 11, marginTop: 4 }}>
                ✅ Matchs nuls sous-estimés : +{stats.drawRate > 25 ? 5 : 0} pts
              </div>
            </div>
          )}
        </>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{ ...S.card, maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ color: '#4a5568', fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>LOG</div>
          {log.map((l, i) => (
            <div key={i} style={{ color: l.type === 'success' ? '#00FFB2' : l.type === 'error' ? '#FF4D6D' : '#4a5568', fontSize: 9, padding: '2px 0' }}>
              {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Boutons */}
      <button style={S.btnGhost('#FFD700')} onClick={weeklyUpdate} disabled={phase === 'updating'}>
        {phase === 'updating' ? '🔄 MISE À JOUR...' : '📅 MISE À JOUR HEBDOMADAIRE'}
      </button>
      <button style={S.btnGhost()} onClick={loadStats}>
        🔃 RAFRAÎCHIR LES STATS
      </button>
      <button style={S.btnGhost('#FF4D6D')} onClick={() => { setPhase('idle'); setLog([]); setProgress(0); }}>
        🔁 RELANCER L'ENTRAÎNEMENT
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <title>KAIROS — Auto-Apprentissage</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>🧠 AUTO-APPRENTISSAGE</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 2 }}>KAIROS APPREND · 10 ANS · MISE À JOUR HEBDO</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none' }}>← KAIROS</a>
          </div>

          {phase === 'idle' && renderIdle()}
          {phase === 'training' && renderTraining()}
          {(phase === 'trained' || phase === 'updating') && renderTrained()}
        </div>
      </div>
    </>
  );
}
