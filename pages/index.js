import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const SCREENS = { HOME: 'home', SCANNER: 'scanner', DETAIL: 'detail', GENERATOR: 'generator', CALCULATOR: 'calculator', IMPORT: 'import', COACH: 'coach', SILENCE: 'silence', HISTORY: 'history', WORLD: 'world' };

const S = {
  app: { background: 'var(--bg-deep)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'var(--font-display)' },
  shell: { width: '100%', maxWidth: 430, background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  header: { padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 16px 100px' },
  nav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--bg-deep)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100 },
  navBtn: (active) => ({ flex: 1, background: 'transparent', border: 'none', padding: '10px 0 8px', cursor: 'pointer', color: active ? 'var(--green)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', borderTop: `2px solid ${active ? 'var(--green)' : 'transparent'}`, transition: 'all 0.2s' }),
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGreen: { background: 'var(--green-dim)', border: '1px solid var(--border-glow)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGold: { background: 'var(--gold-dim)', border: '1px solid #FFD70044', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardRed: { background: 'var(--red-dim)', border: '1px solid #FF4D6D44', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  label: { color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-mono)' },
  btn: { background: 'var(--green)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnWorld: { background: 'linear-gradient(135deg, #FF6B00, #FFD700)', color: '#07090f', border: 'none', borderRadius: 12, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGhost: { background: 'transparent', color: 'var(--green)', border: '1px solid var(--border-glow)', borderRadius: 12, padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' },
  btnSmall: { background: 'transparent', color: 'var(--green)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnPlay: { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnCopy: { background: '#ffffff15', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnDanger: { background: 'transparent', color: 'var(--red)', border: '1px solid #FF4D6D44', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, letterSpacing: 2, padding: '12px 0', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 },
  input: { background: 'var(--bg-deep)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, width: '100%', outline: 'none' },
  section: { color: 'var(--text-muted)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', margin: '18px 0 8px', fontFamily: 'var(--font-mono)' },
};

// Indice KAIROS 1000 points
const KairosIndexBadge = ({ index, size = 'normal' }) => {
  const color = index >= 900 ? '#00FFB2' : index >= 800 ? '#FFD700' : index >= 700 ? '#FF8C00' : '#FF4D6D';
  const icon = index >= 900 ? '🟢' : index >= 800 ? '🟡' : index >= 700 ? '🟠' : '🔴';
  const label = index >= 950 ? 'EXCEPTIONNEL' : index >= 900 ? 'TRÈS FORT' : index >= 850 ? 'BON' : index >= 800 ? 'PRUDENCE' : index >= 700 ? 'RISQUÉ' : 'ÉVITER';

  if (size === 'large') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div style={{ color, fontWeight: 900, fontSize: 48, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{index}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: 3, marginTop: 4, fontFamily: 'var(--font-mono)' }}>/ 1000</div>
        <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{label}</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', flexShrink: 0 }}>
      <div style={{ color, fontWeight: 900, fontSize: 22, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{index}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 8, fontFamily: 'var(--font-mono)' }}>/1000</div>
      <div style={{ fontSize: 14 }}>{icon}</div>
    </div>
  );
};

const LiveBadge = ({ ev }) => {
  if (!ev.isLive) return null;
  return (
    <span style={{ background: '#FF4D6D20', color: '#FF4D6D', border: '1px solid #FF4D6D44', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', animation: 'pulse 1s infinite' }}>
      🔴 LIVE {ev.elapsed && `${ev.elapsed}'`}
    </span>
  );
};

const Badge = ({ text, color = 'var(--green)' }) => (
  <span style={{ background: `${color}20`, color, border: `1px solid ${color}44`, padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>{text}</span>
);

const ValueBadge = ({ valueBet }) => {
  if (!valueBet?.isValue) return null;
  return <span style={{ background: '#FF6B0020', color: '#FF6B00', border: '1px solid #FF6B0044', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>🔥 VALUE +{valueBet.value}%</span>;
};

const TrapBadge = ({ trapData }) => {
  if (!trapData) return null;
  return (
    <span style={{ background: trapData.isTrap ? '#FF4D6D20' : '#00FFB220', color: trapData.color, border: `1px solid ${trapData.color}44`, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
      {trapData.label}
    </span>
  );
};

// Barre de modules KAIROS
const ModulesBar = ({ modules }) => {
  if (!modules) return null;
  const items = [
    { key: 'forme', label: 'Forme' },
    { key: 'classement', label: 'Rank' },
    { key: 'blessures', label: 'Injury' },
    { key: 'valueBet', label: 'Value' },
    { key: 'momentum', label: 'Mom.' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {items.map(item => {
        const val = modules[item.key] || 0;
        const color = val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-muted)';
        return (
          <div key={item.key} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-deep)', borderRadius: 6, padding: '4px 2px' }}>
            <div style={{ color, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{val > 0 ? '+' : ''}{val}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 7, letterSpacing: 1 }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const EventCard = ({ ev, onSelect, onAdd, inTicket }) => {
  const index = ev.kairosIndex || (ev.kairosScore * 10);
  const indexColor = index >= 900 ? '#00FFB2' : index >= 800 ? '#FFD700' : index >= 700 ? '#FF8C00' : '#FF4D6D';

  return (
    <div style={{ ...S.card, cursor: 'pointer', borderColor: ev.isLive ? '#FF4D6D44' : 'var(--border)' }} onClick={() => onSelect(ev)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{ev.competition}</span>
            <LiveBadge ev={ev} />
            {ev.matchTime && !ev.isLive && <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>⏰ {ev.matchTime}</span>}
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>
            {ev.home} {ev.isLive && ev.scoreHome !== null ? `${ev.scoreHome}-${ev.scoreAway}` : ''}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, margin: '2px 0' }}>vs</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{ev.away}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge text={ev.riskLevel} color={ev.riskLevel === 'Faible' ? 'var(--green)' : ev.riskLevel === 'Moyen' ? 'var(--gold)' : 'var(--red)'} />
            <span style={{ color: ev.hasRealOdds ? 'var(--green)' : 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>@{ev.oddHome}</span>
            <ValueBadge valueBet={ev.valueBet} />
          </div>
          {ev.trapData && <div style={{ marginTop: 4 }}><TrapBadge trapData={ev.trapData} /></div>}
          {ev.hasRealOdds && <div style={{ color: 'var(--green)', fontSize: 9, marginTop: 4, fontFamily: 'var(--font-mono)' }}>✅ Cotes en temps réel</div>}
        </div>
        <KairosIndexBadge index={index} />
      </div>
      {ev.modules && <ModulesBar modules={ev.modules} />}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button style={{ ...S.btnSmall, flex: 1 }} onClick={e => { e.stopPropagation(); onSelect(ev); }}>Analyser</button>
        <button style={{ background: inTicket ? 'var(--border)' : 'var(--green)', color: inTicket ? 'var(--text-muted)' : '#07090f', border: 'none', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', flex: 1 }}
          onClick={e => { e.stopPropagation(); onAdd(ev); }}>
          {inTicket ? '✓ Ajouté' : '+ Ticket'}
        </button>
      </div>
    </div>
  );
};

const Loader = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 16 }}>
    <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>{text || 'CHARGEMENT...'}</div>
  </div>
);

function formatTicketForCopy(ticket) {
  const date = new Date().toLocaleDateString('fr-BE');
  let text = `⚡ KAIROS SPORT — ${date}\n`;
  text += `Indice : ${ticket.kairosIndex || ticket.globalScore * 10}/1000 | Risque : ${ticket.globalRisk}\n\n`;
  for (const m of (ticket.matches || [])) {
    text += `${m.sport} ${m.home} vs ${m.away} @${m.odd}\n`;
  }
  text += `\nCote totale : ${ticket.totalOdd}\n`;
  text += `Mise : ${ticket.stake}€ → Gain potentiel : ${ticket.potentialGain}€\n`;
  if (ticket.bestBookmaker) text += `Meilleure cote : ${ticket.bestBookmaker.name}\n`;
  text += `\nAucun pari n'est garanti. Jouez responsable.`;
  return text;
}

export default function KairosSport() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState({ totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 });
  const [ticket, setTicket] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [budget, setBudget] = useState('100');
  const [ticketMode, setTicketMode] = useState('equilibre');
  const [calcOdd, setCalcOdd] = useState('2.10');
  const [calcCustom, setCalcCustom] = useState('');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [minScore, setMinScore] = useState(0);
  const [silenceMode, setSilenceMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [copyMsg, setCopyMsg] = useState('');
  const [psychWarnings, setPsychWarnings] = useState(null);
  const [worldTop3, setWorldTop3] = useState(null);
  const [worldLoading, setWorldLoading] = useState(false);
  const [scannerMsg, setScannerMsg] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => { loadScanner(0); loadHistory(); }, []);

  const loadScanner = async (ms = 0) => {
    try {
      const res = await fetch(`/api/scanner?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const all = data.events || [];
        setAllEvents(all);
        const filtered = ms > 0 ? all.filter(e => (e.kairosIndex || e.kairosScore * 10) >= ms * 10) : all;
        setEvents(filtered);
        setStats(data.stats || {});
        setSilenceMode(all.length === 0);
        if (data.message) setScannerMsg(data.message);
      }
    } catch {}
  };

  const filterEvents = (ms) => {
    setMinScore(ms);
    const filtered = ms > 0 ? allEvents.filter(e => (e.kairosIndex || e.kairosScore * 10) >= ms * 10) : allEvents;
    setEvents(filtered);
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('kairos_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  };

  const saveToHistory = (t) => {
    try {
      const entry = { ...t, savedAt: new Date().toISOString(), id: Date.now(), result: 'pending' };
      const newHistory = [entry, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem('kairos_history', JSON.stringify(newHistory));
    } catch {}
  };

  const deleteFromHistory = (id) => {
    const h = history.filter(x => x.id !== id);
    setHistory(h);
    localStorage.setItem('kairos_history', JSON.stringify(h));
  };

  const updateResult = (id, result) => {
    const h = history.map(x => x.id === id ? { ...x, result } : x);
    setHistory(h);
    localStorage.setItem('kairos_history', JSON.stringify(h));
  };

  const copyTicket = (t) => {
    navigator.clipboard.writeText(formatTicketForCopy(t)).then(() => {
      setCopyMsg('✅ Copié !');
      setTimeout(() => setCopyMsg(''), 2000);
    }).catch(() => { setCopyMsg('❌ Erreur'); setTimeout(() => setCopyMsg(''), 2000); });
  };

  const addToTicket = useCallback((ev) => {
    setTicket(t => t.find(x => x.id === ev.id) ? t.filter(x => x.id !== ev.id) : [...t, ev]);
  }, []);

  const removeFromTicket = useCallback((id) => { setTicket(t => t.filter(x => x.id !== id)); }, []);
  const goTo = (s, ev = null) => { if (ev) setSelected(ev); setScreen(s); window.scrollTo(0, 0); };

  const odd = parseFloat(calcOdd) || 1;
  const mises = [50, 100, 200, 300, 500, 1000];
  const totalOdd = ticket.length > 0 ? ticket.reduce((a, e) => a * e.oddHome, 1) : 0;
  const potentialGain = totalOdd > 0 ? (parseFloat(budget || 0) * totalOdd) : 0;
  const ticketIndex = ticket.length > 0 ? Math.round(ticket.reduce((a, e) => a + (e.kairosIndex || e.kairosScore * 10), 0) / ticket.length) : 0;

  const handleAnalyzeText = async () => {
    if (!importText.trim()) return;
    setImportLoading(true); setImportResult(null);
    try {
      const res = await fetch('/api/analyze-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: importText }) });
      const data = await res.json();
      if (data.success) setImportResult(data.analysis);
    } catch {}
    setImportLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true); setImportResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const res = await fetch('/api/analyze-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, imageType: file.type }) });
        const data = await res.json();
        if (data.success) setImportResult(data.analysis);
      } catch {}
      setImportLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setLoading(true); setLoadingText('ANALYSE EN COURS...'); setGeneratedTickets(null);
    try {
      const res = await fetch('/api/generate-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ budget: parseFloat(budget), mode: ticketMode }) });
      const data = await res.json();
      if (data.success) {
        if (data.silence) { setSilenceMode(true); setScreen(SCREENS.SILENCE); }
        else { setGeneratedTickets(data.tickets); setActiveTicket(data.ticket); if (data.psychWarnings) setPsychWarnings(data.psychWarnings); }
      }
    } catch {}
    setLoading(false);
  };

  const handleWorldMode = async () => {
    setWorldLoading(true); setWorldTop3(null);
    try {
      const res = await fetch('/api/generate-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worldMode: true, budget: parseFloat(budget) }) });
      const data = await res.json();
      if (data.success) {
        if (data.silence) { setSilenceMode(true); setScreen(SCREENS.SILENCE); }
        else { setWorldTop3(data.top3); goTo(SCREENS.WORLD); }
      }
    } catch {}
    setWorldLoading(false);
  };

  const renderHome = () => (
    <div style={{ paddingTop: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ color: 'var(--green)', fontSize: 42, marginBottom: 8 }}>⚡</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, letterSpacing: 3 }}>KAIROS SPORT</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 4, marginTop: 4, fontFamily: 'var(--font-mono)' }}>MOTEUR D'INTELLIGENCE PRÉDICTIVE</div>
      </div>

      {worldLoading ? <Loader text="ANALYSE MONDIALE EN COURS..." /> : (
        <button style={{ ...S.btnWorld, marginBottom: 12 }} onClick={handleWorldMode}>🔥 OPPORTUNITÉS MONDIALES</button>
      )}

      {!silenceMode && events.length > 0 && (() => {
        const best = [...events].sort((a, b) => (b.kairosIndex || b.kairosScore * 10) - (a.kairosIndex || a.kairosScore * 10))[0];
        const idx = best?.kairosIndex || (best?.kairosScore * 10) || 0;
        return (
          <div style={S.cardGreen}>
            <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🥇 MEILLEURE OPPORTUNITÉ DU JOUR</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{best?.home} vs {best?.away}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{best?.competition}</div>
                {best?.trapData && <TrapBadge trapData={best.trapData} />}
              </div>
              <KairosIndexBadge index={idx} size="normal" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn, flex: 1, padding: '10px' }} onClick={() => goTo(SCREENS.GENERATOR)}>GÉNÉRER</button>
              <button style={{ ...S.btnPlay, flex: 1, padding: '10px', fontSize: 11 }} onClick={() => window.open('https://www.unibet.be', '_blank')}>🎯 JOUER</button>
            </div>
          </div>
        );
      })()}

      {silenceMode ? (
        <div style={S.cardGold}>
          <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔇 MODE SILENCE</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Aucune opportunité Premium.</div>
          {scannerMsg && <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{scannerMsg}</div>}
        </div>
      ) : (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>✅ {allEvents.length} MATCHS ANALYSÉS</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {stats.liveCount > 0 && `🔴 ${stats.liveCount} LIVE · `}
            {stats.withRealOdds > 0 && `✅ ${stats.withRealOdds} cotes réelles`}
          </div>
        </div>
      )}

      <button style={{ ...S.btn, marginBottom: 10 }} onClick={() => goTo(SCREENS.SCANNER)}>🔍 ANALYSER LE MARCHÉ</button>

      {/* Accès rapide Leagues + WorldCup */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <a href="/leagues" style={{ flex: 1, background: '#0d1526', border: '1px solid #00FFB244', borderRadius: 12, padding: '12px 8px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 20 }}>⚽</div>
          <div style={{ color: '#00FFB2', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>CHAMPIONNATS</div>
          <div style={{ color: '#4a5568', fontSize: 8 }}>Serie A · Liga · Bundesliga</div>
        </a>
        <a href="/worldcup" style={{ flex: 1, background: '#0d1526', border: '1px solid #FFD70044', borderRadius: 12, padding: '12px 8px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
          <div style={{ fontSize: 20 }}>🏆</div>
          <div style={{ color: '#FFD700', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>WORLD CUP</div>
          <div style={{ color: '#4a5568', fontSize: 8 }}>2026 Predictor</div>
        </a>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.IMPORT)}>📷 Photo</button>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.IMPORT)}>📋 Coller</button>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.HISTORY)}>📂 {history.length > 0 ? history.length : ''} Historique</button>
      </div>

      <div style={S.section}>Top opportunités</div>
      {allEvents.length === 0 && !silenceMode && <Loader text="CHARGEMENT..." />}
      {events.slice(0, 3).map(ev => <EventCard key={ev.id} ev={ev} onSelect={(ev) => goTo(SCREENS.DETAIL, ev)} onAdd={addToTicket} inTicket={!!ticket.find(t => t.id === ev.id)} />)}
      {allEvents.length > 3 && <button style={{ ...S.btnGhost, width: '100%', marginBottom: 12 }} onClick={() => goTo(SCREENS.SCANNER)}>Voir tous ({allEvents.length})</button>}
    </div>
  );

  const renderScanner = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2 }}>SCANNER MONDIAL</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {allEvents.length} MATCHS · {stats.liveCount > 0 ? `🔴 ${stats.liveCount} LIVE` : '30+ LIGUES'}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>SCAN TERMINÉ</span>
          <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>100%</span>
        </div>
        <div style={{ background: 'var(--bg-deep)', borderRadius: 4, height: 5 }}>
          <div style={{ background: 'var(--green)', width: '100%', height: 5, borderRadius: 4 }} />
        </div>
        <div style={{ color: 'var(--green)', fontSize: 11, marginTop: 8, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          ✅ {allEvents.length} analysés · {stats.withRealOdds || 0} cotes réelles
        </div>
      </div>

      {/* Filtres Indice KAIROS */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: 2 }}>FILTRE INDICE KAIROS /1000</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { val: 0, label: 'TOUT', color: 'var(--text-muted)' },
            { val: 70, label: '>700', color: '#FF8C00' },
            { val: 80, label: '>800', color: '#FFD700' },
            { val: 85, label: '>850', color: '#7FFF00' },
            { val: 90, label: '>900', color: '#00FFB2' },
            { val: 95, label: '>950', color: '#00FFB2' },
          ].map(f => (
            <button key={f.val} onClick={() => filterEvents(f.val)}
              style={{ flex: 1, minWidth: 45, background: minScore === f.val ? `${f.color}20` : 'var(--bg-card)', border: `1px solid ${minScore === f.val ? f.color : 'var(--border)'}`, borderRadius: 8, padding: '7px 4px', color: minScore === f.val ? f.color : 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: minScore === f.val ? 700 : 400 }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Stats live */}
      {stats.liveCount > 0 && (
        <div style={{ background: '#FF4D6D15', border: '1px solid #FF4D6D44', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#FF4D6D', fontSize: 12, fontWeight: 700 }}>🔴 {stats.liveCount} match{stats.liveCount > 1 ? 's' : ''} en direct</span>
        </div>
      )}

      {events.length === 0 ? (
        <div style={{ ...S.cardGold, textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔇</div>
          <div style={{ color: 'var(--gold)', fontWeight: 700 }}>Aucune opportunité à ce niveau</div>
          {scannerMsg && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>{scannerMsg}</div>}
          <button style={{ ...S.btnSmall, marginTop: 12, borderColor: '#FFD70044', color: 'var(--gold)' }} onClick={() => filterEvents(0)}>Voir tous les matchs</button>
        </div>
      ) : (
        <>
          <div style={S.section}>Opportunités · {events.length} matchs</div>
          {events.map(ev => <EventCard key={ev.id} ev={ev} onSelect={(ev) => goTo(SCREENS.DETAIL, ev)} onAdd={addToTicket} inTicket={!!ticket.find(t => t.id === ev.id)} />)}
        </>
      )}
    </div>
  );

  const renderDetail = () => {
    if (!selected) return null;
    const ev = selected;
    const index = ev.kairosIndex || (ev.kairosScore * 10) || 0;

    return (
      <div style={{ paddingTop: 16 }}>
        <button style={S.backBtn} onClick={() => goTo(SCREENS.SCANNER)}>← Scanner</button>

        <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{ev.competition}</div>
          {ev.isLive && <LiveBadge ev={ev} />}
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, marginTop: 8 }}>
            {ev.home} {ev.isLive && ev.scoreHome !== null ? `${ev.scoreHome} - ${ev.scoreAway}` : 'vs'} {ev.away}
          </div>
          {ev.matchTime && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>⏰ {ev.matchTime}</div>}
          <div style={{ margin: '20px auto', display: 'flex', justifyContent: 'center' }}>
            <KairosIndexBadge index={index} size="large" />
          </div>
        </div>

        {/* Détecteur de piège */}
        {ev.trapData && (
          <div style={{ background: ev.trapData.isTrap ? '#FF4D6D15' : '#00FFB215', border: `1px solid ${ev.trapData.color}44`, borderRadius: 14, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ color: ev.trapData.color, fontWeight: 700, fontSize: 13 }}>{ev.trapData.label}</div>
            {ev.trapData.traps?.map((t, i) => <div key={i} style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>• {t}</div>)}
          </div>
        )}

        {/* Value Bet */}
        {ev.valueBet?.isValue && (
          <div style={{ background: '#FF6B0015', border: '1px solid #FF6B0044', borderRadius: 14, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🔥 VALUE BET DÉTECTÉ</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div><div style={S.label}>Bookmaker</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{ev.valueBet.bookmakerProb}%</div></div>
              <div><div style={S.label}>IA Kairos</div><div style={{ color: '#FF6B00', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{ev.valueBet.kairosProb}%</div></div>
              <div><div style={S.label}>Value</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>+{ev.valueBet.value}%</div></div>
            </div>
            {ev.valueBet.bookmakerMargin && <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 6 }}>Marge bookmaker : {ev.valueBet.bookmakerMargin}%</div>}
          </div>
        )}

        {/* Monte Carlo */}
        {ev.monteCarlo && (
          <div style={S.card}>
            <div style={S.label}>🎲 Monte Carlo (10 000 simulations)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Domicile', ev.monteCarlo.home, 'var(--green)'], ['Nul', ev.monteCarlo.draw, 'var(--text-muted)'], ['Extérieur', ev.monteCarlo.away, 'var(--red)']].map(([lbl, val, col]) => (
                <div key={lbl} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-deep)', borderRadius: 8 }}>
                  <div style={{ color: col, fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)' }}>{val}%</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modules détaillés */}
        {ev.modules && (
          <div style={S.card}>
            <div style={S.label}>Analyse multicouche</div>
            {Object.entries(ev.modules).map(([key, val]) => {
              if (val === 0) return null;
              const labels = { forme: 'Forme récente', classement: 'Classement', blessures: 'Blessures', h2h: 'H2H', valueBet: 'Value Bet', xG: 'Expected Goals', momentum: 'Momentum', contexte: 'Contexte', pieges: 'Pièges' };
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{labels[key] || key}</span>
                  <span style={{ color: val > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)' }}>{val > 0 ? '+' : ''}{val} pts</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Données brutes */}
        {ev.rawData && (
          <div style={S.card}>
            <div style={S.label}>Données réelles</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Forme Dom.', ev.rawData.formHome?.join('') || '-'],
                ['Forme Ext.', ev.rawData.formAway?.join('') || '-'],
                ['Position Dom.', `${ev.rawData.posHome}e`],
                ['Position Ext.', `${ev.rawData.posAway}e`],
                ['Blessés Dom.', ev.rawData.injHome],
                ['Blessés Ext.', ev.rawData.injAway],
                ['H2H Dom.', `${ev.rawData.h2hHome}V`],
                ['H2H Ext.', `${ev.rawData.h2hAway}V`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: 'var(--bg-deep)', borderRadius: 8, padding: '8px' }}>
                  <div style={S.label}>{lbl}</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cotes */}
        <div style={S.card}>
          <div style={S.label}>Cotes {ev.hasRealOdds ? '✅ Temps réel' : '(estimées)'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['1', ev.oddHome, 'var(--green)'], ['X', ev.oddDraw, 'var(--text-muted)'], ['2', ev.oddAway, 'var(--text-muted)']].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: 1, textAlign: 'center', background: 'var(--bg-deep)', borderRadius: 8, padding: '10px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{lbl}</div>
                <div style={{ color: col, fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-mono)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Facteurs */}
        {ev.factors && ev.factors.length > 0 && (
          <div style={S.card}>
            <div style={S.label}>Pourquoi ce pari ?</div>
            {ev.factors.map((f, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '4px 0' }}>{f}</div>)}
          </div>
        )}

        <button style={S.btn} onClick={() => { addToTicket(ev); goTo(SCREENS.GENERATOR); }}>
          {ticket.find(t => t.id === ev.id) ? '✓ VOIR MON TICKET' : '+ AJOUTER AU TICKET'}
        </button>
        <div style={{ height: 12 }} />
      </div>
    );
  };

  const renderGenerator = () => {
    const modes = [
      { id: 'prudent', label: '🛡️ Prudent', desc: '3 · >850' },
      { id: 'equilibre', label: '⚖️ Équilibré', desc: '5 · >800' },
      { id: 'agressif', label: '🔥 Agressif', desc: '8 · >750' },
    ];
    return (
      <div style={{ paddingTop: 16 }}>
        <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>GÉNÉRATEUR DE TICKET</div>

        {psychWarnings && psychWarnings.map((w, i) => (
          <div key={i} style={{ background: '#FF4D6D15', border: '1px solid #FF4D6D44', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ color: 'var(--red)', fontSize: 12 }}>{w.message}</div>
          </div>
        ))}

        <div style={S.card}>
          <div style={S.label}>Budget (€)</div>
          <input value={budget} onChange={e => setBudget(e.target.value)} style={S.input} placeholder="Ex: 100" type="number" min="1" />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {['50', '100', '200', '500'].map(v => (
              <button key={v} onClick={() => setBudget(v)}
                style={{ flex: 1, background: budget === v ? 'var(--green-dim)' : 'var(--bg-deep)', border: `1px solid ${budget === v ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 0', color: budget === v ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{v}€</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {modes.map(m => (
            <button key={m.id} onClick={() => setTicketMode(m.id)}
              style={{ flex: 1, background: ticketMode === m.id ? 'var(--green-dim)' : 'var(--bg-card)', border: `1px solid ${ticketMode === m.id ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 6px', color: ticketMode === m.id ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 9, marginTop: 2 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {loading ? <Loader text={loadingText} /> : <button style={S.btn} onClick={handleGenerate}>⚡ GÉNÉRER MON TICKET</button>}

        {generatedTickets && activeTicket && (
          <>
            <div style={S.section}>Modes disponibles</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['prudent', 'equilibre', 'agressif'].map(m => {
                const t = generatedTickets[m];
                if (!t) return null;
                return (
                  <button key={m} onClick={() => setActiveTicket(t)}
                    style={{ flex: 1, background: activeTicket?.mode === m ? 'var(--green-dim)' : 'var(--bg-card)', border: `1px solid ${activeTicket?.mode === m ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: activeTicket?.mode === m ? 'var(--green)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{t.modeLabel}</div>
                    <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, marginTop: 2 }}>{t.potentialGain} €</div>
                  </button>
                );
              })}
            </div>

            <div style={S.cardGreen}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>{activeTicket.modeLabel}</div>
                <KairosIndexBadge index={activeTicket.kairosIndex || activeTicket.globalScore * 10} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Sélections', activeTicket.matchCount], ['Cote totale', activeTicket.totalOdd], ['Mise', `${activeTicket.stake} €`], ['Gain potentiel', `${activeTicket.potentialGain} €`]].map(([lbl, val]) => (
                  <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl === 'Gain potentiel' ? 'var(--green)' : 'var(--text-primary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
                ))}
              </div>
              {(activeTicket.matches || []).map((m, i) => (
                <div key={i} style={{ padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{m.sport} {m.home} vs {m.away}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>@{m.odd} · Indice {m.kairosIndex || m.kairosScore * 10}/1000</div>
                </div>
              ))}
              {copyMsg && <div style={{ color: 'var(--green)', fontSize: 12, textAlign: 'center', margin: '8px 0' }}>{copyMsg}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ ...S.btnCopy, flex: 1 }} onClick={() => copyTicket(activeTicket)}>📋 COPIER</button>
                <button style={{ ...S.btnCopy, flex: 1, color: 'var(--green)', borderColor: 'var(--border-glow)' }} onClick={() => { saveToHistory(activeTicket); alert('✅ Sauvegardé !'); }}>💾 SAUVEGARDER</button>
              </div>
              <button style={{ ...S.btnPlay, marginTop: 8 }} onClick={() => window.open('https://www.unibet.be', '_blank')}>🎯 JOUER MAINTENANT</button>
            </div>
          </>
        )}

        {ticket.length > 0 && (
          <>
            <div style={S.section}>Mon ticket manuel ({ticket.length})</div>
            <div style={S.cardGreen}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>TICKET MANUEL</div>
                <KairosIndexBadge index={ticketIndex} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Sélections', ticket.length], ['Cote totale', totalOdd.toFixed(2)], ['Gain potentiel', `${potentialGain.toFixed(0)} €`], ['Bénéfice', `+${(potentialGain - parseFloat(budget || 0)).toFixed(0)} €`]].map(([lbl, val]) => (
                  <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl.includes('Gain') || lbl.includes('Bénéfice') ? 'var(--green)' : 'var(--text-primary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
                ))}
              </div>
              {ticket.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{ev.sport} {ev.home} vs {ev.away}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>@{ev.oddHome} · {ev.kairosIndex || ev.kairosScore * 10}/1000</div>
                  </div>
                  <button onClick={() => removeFromTicket(ev.id)} style={S.btnDanger}>✕</button>
                </div>
              ))}
              {copyMsg && <div style={{ color: 'var(--green)', fontSize: 12, textAlign: 'center', margin: '8px 0' }}>{copyMsg}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ ...S.btnCopy, flex: 1 }} onClick={() => copyTicket({ matches: ticket, kairosIndex: ticketIndex, globalRisk: 'Manuel', totalOdd: totalOdd.toFixed(2), stake: budget, potentialGain: potentialGain.toFixed(0), modeLabel: 'Manuel' })}>📋 COPIER</button>
                <button style={{ ...S.btnCopy, flex: 1, color: 'var(--green)', borderColor: 'var(--border-glow)' }} onClick={() => { saveToHistory({ matches: ticket, kairosIndex: ticketIndex, globalRisk: 'Manuel', totalOdd: totalOdd.toFixed(2), stake: budget, potentialGain: potentialGain.toFixed(0), modeLabel: 'Manuel' }); alert('✅ Sauvegardé !'); }}>💾 SAUVEGARDER</button>
              </div>
              <button style={{ ...S.btnPlay, marginTop: 8 }} onClick={() => window.open('https://www.unibet.be', '_blank')}>🎯 JOUER MAINTENANT</button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderWorld = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 4px' }}>🔥 OPPORTUNITÉS MONDIALES</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Top 3 mondial · {allEvents.length} analysés</div>
      {!worldTop3 ? <Loader text="ANALYSE EN COURS..." /> : worldTop3.map((ev, i) => (
        <div key={ev.id} style={{ ...S.card, border: `1px solid ${i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{ev.competition}</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{ev.home} vs {ev.away}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Badge text={ev.riskLevel} color={ev.riskLevel === 'Faible' ? 'var(--green)' : 'var(--gold)'} />
                <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>@{ev.oddHome}</span>
                <ValueBadge valueBet={ev.valueBet} />
              </div>
            </div>
            <KairosIndexBadge index={ev.kairosIndex || ev.kairosScore * 10} />
          </div>
          {ev.monteCarlo && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: '8px', background: 'var(--bg-deep)', borderRadius: 8 }}>
              {[['Dom.', ev.monteCarlo.home, 'var(--green)'], ['Nul', ev.monteCarlo.draw, 'var(--text-muted)'], ['Ext.', ev.monteCarlo.away, 'var(--text-muted)']].map(([lbl, val, col]) => (
                <div key={lbl} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ color: col, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{val}%</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{lbl}</div>
                </div>
              ))}
            </div>
          )}
          {ev.factors && ev.factors.slice(0, 3).map((f, j) => <div key={j} style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>{f}</div>)}
          <a href={`https://www.unibet.be`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', borderRadius: 10, padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', marginTop: 10, letterSpacing: 2 }}>
            🎯 JOUER SUR UNIBET →
          </a>
        </div>
      ))}
    </div>
  );

  const renderHistory = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 4px' }}>MES TICKETS</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 16 }}>{history.length} ticket{history.length > 1 ? 's' : ''} sauvegardé{history.length > 1 ? 's' : ''}</div>
      {history.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun ticket sauvegardé</div>
        </div>
      ) : history.map(h => (
        <div key={h.id} style={{ ...S.card, borderColor: h.result === 'win' ? '#00FFB244' : h.result === 'loss' ? '#FF4D6D44' : 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>{h.modeLabel || 'Ticket'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {new Date(h.savedAt).toLocaleDateString('fr-BE')} · {h.kairosIndex || (h.globalScore * 10)}/1000
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 15 }}>{h.potentialGain} €</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Mise : {h.stake} €</div>
            </div>
          </div>
          {h.matches?.map((m, i) => (
            <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 11, padding: '3px 0', borderTop: i === 0 ? '1px solid var(--border)' : 'none' }}>
              {m.sport} {m.home} vs {m.away} @{m.odd}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button style={{ ...S.btnCopy, fontSize: 10 }} onClick={() => copyTicket(h)}>📋</button>
            <button style={{ ...S.btnSmall, fontSize: 10, background: h.result === 'win' ? 'var(--green-dim)' : 'transparent', borderColor: h.result === 'win' ? 'var(--green)' : 'var(--border)', color: h.result === 'win' ? 'var(--green)' : 'var(--text-muted)' }} onClick={() => updateResult(h.id, 'win')}>✅ Gagné</button>
            <button style={{ ...S.btnSmall, fontSize: 10, background: h.result === 'loss' ? 'var(--red-dim)' : 'transparent', borderColor: h.result === 'loss' ? 'var(--red)' : 'var(--border)', color: h.result === 'loss' ? 'var(--red)' : 'var(--text-muted)' }} onClick={() => updateResult(h.id, 'loss')}>❌ Perdu</button>
            <button style={{ ...S.btnDanger, fontSize: 10 }} onClick={() => { if (confirm('Supprimer ?')) deleteFromHistory(h.id); }}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalculator = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>CALCULATEUR</div>
      <div style={S.card}>
        <div style={S.label}>Cote totale</div>
        <input value={calcOdd} onChange={e => setCalcOdd(e.target.value)} type="number" step="0.01" min="1"
          style={{ ...S.input, color: 'var(--green)', fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 700, border: '1px solid var(--border-glow)' }} />
      </div>
      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[['Mise', 'var(--text-muted)'], ['Gain brut', 'var(--gold)'], ['Bénéfice', 'var(--green)']].map(([h, c]) => (
            <div key={h} style={{ color: c, fontSize: 10, textAlign: 'right', padding: '6px 4px', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>{h}</div>
          ))}
          {mises.map(m => [
            <div key={`m${m}`} style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', padding: '9px 4px', fontSize: 13, fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>{m} €</div>,
            <div key={`g${m}`} style={{ color: 'var(--gold)', textAlign: 'right', padding: '9px 4px', fontSize: 13, fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>{(m * odd).toFixed(0)} €</div>,
            <div key={`b${m}`} style={{ color: 'var(--green)', fontWeight: 700, textAlign: 'right', padding: '9px 4px', fontSize: 13, fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)' }}>+{(m * odd - m).toFixed(0)} €</div>
          ])}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.label}>Montant personnalisé (€)</div>
        <input value={calcCustom} onChange={e => setCalcCustom(e.target.value)} type="number" min="1" style={S.input} placeholder="Ex: 750" />
        {calcCustom && parseFloat(calcCustom) > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <div><div style={S.label}>Gain brut</div><div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)' }}>{(parseFloat(calcCustom) * odd).toFixed(0)} €</div></div>
            <div><div style={S.label}>Bénéfice net</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)' }}>+{(parseFloat(calcCustom) * odd - parseFloat(calcCustom)).toFixed(0)} €</div></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderImport = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>ANALYSER MON TICKET</div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[['📷', 'Prendre une photo'], ['🖼️', 'Importer une image']].map(([icon, label]) => (
          <button key={label} style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start', padding: '14px 16px', fontSize: 13 }} onClick={() => fileRef.current?.click()}>
            <span style={{ fontSize: 22 }}>{icon}</span><span>{label}</span>
          </button>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.label}>Ou collez votre ticket ici</div>
        <textarea value={importText} onChange={e => setImportText(e.target.value)}
          placeholder={"Ex :\nFrance - Espagne @1.85\nPSG - Lyon @1.40\nMise : 50€"}
          rows={5} style={{ ...S.input, resize: 'none', lineHeight: 1.6 }} />
        {importLoading ? <Loader text="GEMINI ANALYSE..." /> : (
          <button style={{ ...S.btn, marginTop: 10 }} onClick={handleAnalyzeText} disabled={!importText.trim()}>ANALYSER</button>
        )}
      </div>
      {importResult && (
        <div style={importResult.globalScore >= 80 ? S.cardGreen : S.cardGold}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['Matchs', importResult.matchCount], ['Mise', `${importResult.stake || '?'} €`], ['Gain potentiel', `${Math.round(importResult.potentialGain || 0)} €`], ['Indice KAIROS', `${(importResult.globalScore || 0) * 10}/1000`]].map(([lbl, val]) => (
              <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl === 'Indice KAIROS' ? 'var(--green)' : 'var(--text-primary)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
            ))}
          </div>
          {importResult.matches?.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 12 }}>{m.home} vs {m.away}</div>
              <div style={{ color: m.kairosScore >= 80 ? 'var(--green)' : 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{(m.kairosScore || 0) * 10}/1000</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCoach = () => {
    const finished = history.filter(h => h.result !== 'pending');
    const wins = finished.filter(h => h.result === 'win');
    const totalStake = finished.reduce((a, h) => a + parseFloat(h.stake || 0), 0);
    const totalGain = wins.reduce((a, h) => a + parseFloat(h.potentialGain || 0), 0);
    const roi = totalStake > 0 ? ((totalGain - totalStake) / totalStake * 100).toFixed(1) : 0;
    return (
      <div style={{ paddingTop: 16 }}>
        <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>MON COACH KAIROS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[['Tickets', history.length], ['Succès', `${finished.length > 0 ? ((wins.length / finished.length) * 100).toFixed(0) : 0}%`], ['ROI', `${roi > 0 ? '+' : ''}${roi}%`]].map(([lbl, val]) => (
            <div key={lbl} style={{ ...S.card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ color: 'var(--green)', fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-mono)' }}>{val}</div>
              <div style={{ ...S.label, marginBottom: 0, marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={S.cardGreen}>
          <div style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>✅ VOUS RÉUSSISSEZ AVEC</div>
          {['Indice KAIROS > 850', 'Tickets 3 à 5 matchs', 'Value bets détectés', 'Serie A + Premier League'].map(s => (
            <div key={s} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>✓ {s}</div>
          ))}
        </div>
        <div style={S.cardRed}>
          <div style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>❌ ÉVITER</div>
          {['Indice < 700', 'Matchs sans enjeu 🔴', 'Favoris cote < 1.25', 'Plus de 8 matchs'].map(s => (
            <div key={s} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>✗ {s}</div>
          ))}
        </div>
        <div style={S.cardGold}>
          <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>💡 CONSEIL DU JOUR</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            {history.length === 0 ? '« Commencez par générer votre premier ticket et marquez le résultat pour que je puisse vous coacher. »' : wins.length / Math.max(finished.length, 1) > 0.5 ? '« Excellente forme ! Continuez avec des tickets Indice > 850. »' : '« Revenez aux bases — tickets courts, value bets uniquement, Indice > 850. »'}
          </div>
        </div>
        <button style={{ ...S.btnGhost, width: '100%', marginTop: 8 }} onClick={() => goTo(SCREENS.HISTORY)}>📂 Voir mon historique ({history.length})</button>
      </div>
    );
  };

  const renderSilence = () => (
    <div style={{ paddingTop: 60, textAlign: 'center', padding: '60px 20px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔇</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 22, letterSpacing: 2, lineHeight: 1.4, marginBottom: 8 }}>AUCUNE OPPORTUNITÉ<br />PREMIUM AUJOURD'HUI</div>
      <div style={{ ...S.cardGold, margin: '24px 0' }}>
        <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Recommandation</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>Conservez votre capital.<br />Les meilleures décisions sont parfois de ne pas jouer.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={S.btnGhost} onClick={() => { loadScanner(0); goTo(SCREENS.HOME); }}>Réanalyser</button>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (screen) {
      case SCREENS.HOME: return renderHome();
      case SCREENS.SCANNER: return renderScanner();
      case SCREENS.DETAIL: return renderDetail();
      case SCREENS.GENERATOR: return renderGenerator();
      case SCREENS.CALCULATOR: return renderCalculator();
      case SCREENS.IMPORT: return renderImport();
      case SCREENS.COACH: return renderCoach();
      case SCREENS.SILENCE: return renderSilence();
      case SCREENS.HISTORY: return renderHistory();
      case SCREENS.WORLD: return renderWorld();
      default: return renderHome();
    }
  };

  const navTabs = [
    { id: SCREENS.HOME, icon: '⚡', label: 'Accueil' },
    { id: SCREENS.SCANNER, icon: '🔍', label: 'Scanner' },
    { id: SCREENS.GENERATOR, icon: '🎯', label: 'Ticket' },
    { id: SCREENS.CALCULATOR, icon: '🧮', label: 'Calcul' },
    { id: SCREENS.COACH, icon: '📊', label: 'Coach' },
  ];

  const navScreens = [SCREENS.HOME, SCREENS.SCANNER, SCREENS.GENERATOR, SCREENS.CALCULATOR, SCREENS.COACH];
  const activeTab = navScreens.includes(screen) ? screen : SCREENS.HOME;

  return (
    <>
      <Head>
        <title>KAIROS SPORT — Intelligence Prédictive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 18, letterSpacing: 3, fontFamily: 'var(--font-mono)' }}>⚡ KAIROS</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 8, letterSpacing: 3, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Intelligence Prédictive</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {history.length > 0 && <button style={{ ...S.btnSmall, fontSize: 9, padding: '4px 8px' }} onClick={() => goTo(SCREENS.HISTORY)}>📂 {history.length}</button>}
              {ticket.length > 0 && <button style={{ background: 'var(--green-dim)', border: '1px solid var(--border-glow)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', color: 'var(--green)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }} onClick={() => goTo(SCREENS.GENERATOR)}>🎯 {ticket.length}</button>}
            </div>
          </div>
          <div style={S.scroll}>{renderScreen()}</div>
          <div style={{ background: 'var(--bg-deep)', padding: '5px 16px 6px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 8, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>Aucun pari n'est garanti · Jouez responsable</div>
          </div>
          <div style={S.nav}>
            {navTabs.map(t => (
              <button key={t.id} style={S.navBtn(activeTab === t.id)} onClick={() => goTo(t.id)}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>
                <div>{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
