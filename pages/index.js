import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const SCREENS = { HOME: 'home', SCANNER: 'scanner', DETAIL: 'detail', GENERATOR: 'generator', CALCULATOR: 'calculator', IMPORT: 'import', COACH: 'coach', SILENCE: 'silence' };

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
  btn: { background: 'var(--green)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase', transition: 'opacity 0.2s' },
  btnGhost: { background: 'transparent', color: 'var(--green)', border: '1px solid var(--border-glow)', borderRadius: 12, padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' },
  btnSmall: { background: 'transparent', color: 'var(--green)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnPlay: { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, letterSpacing: 2, padding: '12px 0', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 },
  input: { background: 'var(--bg-deep)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, width: '100%', outline: 'none' },
  section: { color: 'var(--text-muted)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', margin: '18px 0 8px', fontFamily: 'var(--font-mono)' },
};

const ScoreRing = ({ score, size = 72 }) => {
  const r = size * 0.37;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? '#00FFB2' : score >= 75 ? '#FFD700' : '#FF4D6D';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2a40" strokeWidth={size*0.08} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
        strokeDasharray={`${fill} ${circ-fill}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{ transition: 'all 0.8s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        style={{ fill: color, fontSize: size*0.21, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{score}</text>
    </svg>
  );
};

const Badge = ({ text, color = 'var(--green)' }) => (
  <span style={{ background: `${color}20`, color, border: `1px solid ${color}44`, padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>{text}</span>
);

const ValueBadge = ({ valueBet }) => {
  if (!valueBet || !valueBet.isValue) return null;
  return (
    <span style={{ background: '#FF6B0020', color: '#FF6B00', border: '1px solid #FF6B0044', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>
      🔥 VALUE +{valueBet.value}%
    </span>
  );
};

const EventCard = ({ ev, onSelect, onAdd, inTicket }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer' }} onClick={() => onSelect(ev)}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, marginRight: 12 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 1, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{ev.sport} {ev.competition}</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{ev.home}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, margin: '2px 0' }}>vs</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{ev.away}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge text={ev.riskLevel} color={ev.riskLevel === 'Faible' ? 'var(--green)' : ev.riskLevel === 'Moyen' ? 'var(--gold)' : 'var(--red)'} />
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>@{ev.oddHome}</span>
          <ValueBadge valueBet={ev.valueBet} />
        </div>
      </div>
      <ScoreRing score={ev.kairosScore} size={60} />
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      <button style={{ background: 'transparent', color: 'var(--green)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', flex: 1 }}
        onClick={e => { e.stopPropagation(); onSelect(ev); }}>Analyser</button>
      <button style={{ background: inTicket ? 'var(--border)' : 'var(--green)', color: inTicket ? 'var(--text-muted)' : '#07090f', border: 'none', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', flex: 1 }}
        onClick={e => { e.stopPropagation(); onAdd(ev); }}>
        {inTicket ? '✓ Ajouté' : '+ Ticket'}
      </button>
    </div>
  </div>
);

const Loader = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 16 }}>
    <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 2, fontFamily: 'var(--font-mono)' }}>{text || 'CHARGEMENT...'}</div>
  </div>
);

const BookmakerCard = ({ bookmakers, totalOdd }) => {
  if (!bookmakers || bookmakers.length === 0) return null;
  const best = bookmakers[0];
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid #FFD70044', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-mono)' }}>🏆 COMPARATEUR BOOKMAKERS BELGES</div>
      {bookmakers.map((b, i) => (
        <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i === 0 && <span style={{ color: 'var(--gold)', fontSize: 12 }}>🥇</span>}
            {i === 1 && <span style={{ color: '#C0C0C0', fontSize: 12 }}>🥈</span>}
            {i === 2 && <span style={{ color: '#CD7F32', fontSize: 12 }}>🥉</span>}
            {i > 2 && <span style={{ width: 20 }} />}
            <span style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 13, fontWeight: i === 0 ? 700 : 400 }}>{b.name}</span>
          </div>
          <span style={{ color: i === 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>@{b.odd}</span>
        </div>
      ))}
      <a href={best.url} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', marginTop: 10, letterSpacing: 2 }}>
        🎯 JOUER SUR {best.name} →
      </a>
    </div>
  );
};

export default function KairosSport() {
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalAnalyzed: 0, premiumCount: 0, ignoredCount: 0 });
  const [ticket, setTicket] = useState([]);
  const [selected, setSelected] = useState(null);
  const [userStats, setUserStats] = useState(null);
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
  const [minScore, setMinScore] = useState(80);
  const [silenceMode, setSilenceMode] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => { loadScanner(); loadUserStats(); }, []);

  const loadScanner = async (ms = 80) => {
    try {
      const res = await fetch(`/api/scanner?minScore=${ms}`);
      const data = await res.json();
      if (data.success) { setEvents(data.events); setStats(data.stats); setSilenceMode(data.events.length === 0); }
    } catch {}
  };

  const loadUserStats = async () => {
    try {
      const res = await fetch('/api/user-stats');
      const data = await res.json();
      if (data.success) setUserStats(data.stats);
    } catch {}
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
  const ticketScore = ticket.length > 0 ? Math.round(ticket.reduce((a, e) => a + e.kairosScore, 0) / ticket.length) : 0;
  const worstMatch = ticket.length > 0 ? ticket.reduce((mn, e) => e.kairosScore < mn.kairosScore ? e : mn, ticket[0]) : null;

  const handleAnalyzeText = async () => {
    if (!importText.trim()) return;
    setImportLoading(true); setImportResult(null);
    try {
      const res = await fetch('/api/analyze-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: importText }) });
      const data = await res.json();
      if (data.success) setImportResult(data.analysis);
      else alert('Erreur : ' + data.error);
    } catch { alert('Erreur réseau'); }
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
        else alert('Erreur : ' + data.error);
      } catch { alert('Erreur réseau'); }
      setImportLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setLoading(true); setLoadingText('ANALYSE EN COURS...'); setGeneratedTickets(null);
    try {
      const res = await fetch('/api/generate-ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ budget: parseFloat(budget), mode: ticketMode, minScore }) });
      const data = await res.json();
      if (data.success) {
        if (data.silence) { setSilenceMode(true); setScreen(SCREENS.SILENCE); }
        else { setGeneratedTickets(data.tickets); setActiveTicket(data.ticket); }
      }
    } catch {}
    setLoading(false);
  };

  const renderHome = () => (
    <div style={{ paddingTop: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ color: 'var(--green)', fontSize: 42, marginBottom: 8 }}>⚡</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, letterSpacing: 3 }}>KAIROS SPORT</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 4, marginTop: 4, fontFamily: 'var(--font-mono)' }}>TROUVER PEU · TROUVER LE MEILLEUR</div>
      </div>

      {/* Ticket du jour — visible dès l'ouverture */}
      {!silenceMode && events.length > 0 && (
        <div style={{ ...S.cardGreen, marginBottom: 14 }}>
          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🥇 TICKET DU JOUR</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div><div style={S.label}>Score</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)' }}>{events[0]?.kairosScore}/100</div></div>
            <div><div style={S.label}>Mise 100€</div><div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)' }}>{(100 * (events[0]?.oddHome || 2)).toFixed(0)} €</div></div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
            {events[0]?.sport} {events[0]?.home} vs {events[0]?.away}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btn, flex: 1, padding: '10px' }} onClick={() => goTo(SCREENS.GENERATOR)}>GÉNÉRER MON TICKET</button>
            <button style={{ ...S.btnPlay, flex: 1, padding: '10px', fontSize: 11 }}
              onClick={() => window.open('https://www.unibet.be', '_blank')}>
              🎯 JOUER
            </button>
          </div>
        </div>
      )}

      {silenceMode ? (
        <div style={S.cardGold}>
          <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔇 MODE SILENCE ACTIF</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Aucune opportunité Premium aujourd'hui.</div>
          <button style={{ ...S.btnSmall, marginTop: 8, borderColor: '#FFD70044', color: 'var(--gold)' }} onClick={() => { setMinScore(70); loadScanner(70); }}>Abaisser le seuil à 70</button>
        </div>
      ) : (
        <div style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>✅ {stats.premiumCount} OPPORTUNITÉ{stats.premiumCount > 1 ? 'S' : ''} PREMIUM</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{stats.totalAnalyzed?.toLocaleString()} événements analysés</div>
        </div>
      )}

      <button style={{ ...S.btn, marginBottom: 10 }} onClick={() => goTo(SCREENS.SCANNER)}>🔍 ANALYSER LE MARCHÉ</button>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.IMPORT)}>📷 Photo</button>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.IMPORT)}>📋 Coller</button>
        <button style={{ ...S.btnGhost, flex: 1, fontSize: 11 }} onClick={() => goTo(SCREENS.GENERATOR)}>🎯 Générer</button>
      </div>

      <div style={S.section}>Top opportunités</div>
      {events.length === 0 && !silenceMode && <div style={{ ...S.card, textAlign: 'center' }}><Loader text="CHARGEMENT..." /></div>}
      {events.slice(0, 3).map(ev => <EventCard key={ev.id} ev={ev} onSelect={(ev) => goTo(SCREENS.DETAIL, ev)} onAdd={addToTicket} inTicket={!!ticket.find(t => t.id === ev.id)} />)}
      {events.length > 3 && <button style={{ ...S.btnGhost, width: '100%', marginBottom: 12 }} onClick={() => goTo(SCREENS.SCANNER)}>Voir tous ({events.length})</button>}
    </div>
  );

  const renderScanner = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2 }}>SCANNER MONDIAL</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{stats.totalAnalyzed?.toLocaleString()} ÉVÉNEMENTS</div>
      </div>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>SCAN TERMINÉ</span>
          <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>100%</span>
        </div>
        <div style={{ background: 'var(--bg-deep)', borderRadius: 4, height: 5 }}>
          <div style={{ background: 'var(--green)', width: '100%', height: 5, borderRadius: 4 }} />
        </div>
        <div style={{ color: 'var(--green)', fontSize: 11, marginTop: 8, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>✅ {stats.premiumCount} Premium · {stats.ignoredCount?.toLocaleString()} ignorés</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[75, 80, 85, 90].map(s => (
          <button key={s} onClick={() => { setMinScore(s); loadScanner(s); }}
            style={{ flex: 1, background: minScore === s ? 'var(--green-dim)' : 'var(--bg-card)', border: `1px solid ${minScore === s ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '7px 0', color: minScore === s ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)' }}>&gt;{s}</button>
        ))}
      </div>
      <div style={S.section}>Opportunités · Score &gt; {minScore}</div>
      {events.length === 0 ? (
        <div style={{ ...S.cardGold, textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔇</div>
          <div style={{ color: 'var(--gold)', fontWeight: 700 }}>Aucune opportunité à ce niveau</div>
          <button style={{ ...S.btnSmall, marginTop: 12, borderColor: '#FFD70044', color: 'var(--gold)' }} onClick={() => { setMinScore(Math.max(60, minScore - 5)); loadScanner(Math.max(60, minScore - 5)); }}>Baisser le seuil</button>
        </div>
      ) : events.map(ev => <EventCard key={ev.id} ev={ev} onSelect={(ev) => goTo(SCREENS.DETAIL, ev)} onAdd={addToTicket} inTicket={!!ticket.find(t => t.id === ev.id)} />)}
    </div>
  );

  const renderDetail = () => {
    if (!selected) return null;
    const ev = selected;
    const bookmakers = ev.bookmakers || [
      { name: 'Unibet', odd: ev.oddHome, url: 'https://www.unibet.be' },
      { name: 'Circus', odd: (ev.oddHome * 1.02).toFixed(2), url: 'https://www.circus.be' },
      { name: 'Napoleon', odd: (ev.oddHome * 0.98).toFixed(2), url: 'https://www.napoleon.be' },
      { name: 'Ladbrokes', odd: (ev.oddHome * 1.01).toFixed(2), url: 'https://www.ladbrokes.be' },
      { name: 'Betfirst', odd: (ev.oddHome * 1.03).toFixed(2), url: 'https://www.betfirst.be' },
    ].sort((a, b) => parseFloat(b.odd) - parseFloat(a.odd));

    return (
      <div style={{ paddingTop: 16 }}>
        <button style={S.backBtn} onClick={() => goTo(SCREENS.SCANNER)}>← Scanner</button>
        <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{ev.sport} {ev.competition}</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>{ev.home}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0' }}>vs</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>{ev.away}</div>
          <div style={{ margin: '16px auto 4px', display: 'flex', justifyContent: 'center' }}><ScoreRing score={ev.kairosScore} size={110} /></div>
          <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: 4, fontFamily: 'var(--font-mono)' }}>KAIROS SCORE</div>
        </div>

        {/* Value Bet */}
        {ev.valueBet?.isValue && (
          <div style={{ background: '#FF6B0015', border: '1px solid #FF6B0044', borderRadius: 14, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ color: '#FF6B00', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🔥 VALUE BET DÉTECTÉ</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div><div style={S.label}>Bookmaker</div><div style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{ev.valueBet.bookmakerProb}%</div></div>
              <div><div style={S.label}>IA Kairos</div><div style={{ color: '#FF6B00', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{ev.valueBet.kairosProb}%</div></div>
              <div><div style={S.label}>Value</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>+{ev.valueBet.value}%</div></div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[['Confiance', `${ev.confidence}%`, 'var(--green)'], ['Probabilité', `${ev.probability}%`, 'var(--gold)'], ['Données', ev.dataQuality, 'var(--green)']].map(([lbl, val, col]) => (
            <div key={lbl} style={{ ...S.card, textAlign: 'center', padding: '10px 6px' }}>
              <div style={S.label}>{lbl}</div>
              <div style={{ color: col, fontWeight: 700, fontSize: 13 }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={S.label}>Détail du score</div>
          {(ev.breakdown || []).map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{b.label}</span>
              <span style={{ color: b.good ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)' }}>{b.value > 0 ? '+' : ''}{b.value} {b.good ? '✅' : '⚠️'}</span>
            </div>
          ))}
        </div>

        <BookmakerCard bookmakers={bookmakers} totalOdd={ev.oddHome} />

        <button style={S.btn} onClick={() => { addToTicket(ev); goTo(SCREENS.GENERATOR); }}>
          {ticket.find(t => t.id === ev.id) ? '✓ VOIR MON TICKET' : '+ AJOUTER AU TICKET'}
        </button>
        <div style={{ height: 12 }} />
      </div>
    );
  };

  const renderGenerator = () => {
    const modes = [
      { id: 'prudent', label: '🛡️ Prudent', desc: '3 matchs · Score >85' },
      { id: 'equilibre', label: '⚖️ Équilibré', desc: '5 matchs · Score >80' },
      { id: 'agressif', label: '🔥 Agressif', desc: '8 matchs · Score >75' },
    ];
    return (
      <div style={{ paddingTop: 16 }}>
        <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>GÉNÉRATEUR DE TICKET</div>

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
              <div style={{ fontSize: 13, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 9, marginTop: 2, letterSpacing: 0 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {loading ? <Loader text={loadingText} /> : <button style={S.btn} onClick={handleGenerate}>⚡ GÉNÉRER MON TICKET</button>}

        {/* Tickets générés avec 3 modes */}
        {generatedTickets && (
          <>
            <div style={S.section}>Choisir un mode</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['prudent', 'equilibre', 'agressif'].map(m => {
                const t = generatedTickets[m];
                if (!t) return null;
                return (
                  <button key={m} onClick={() => setActiveTicket(t)}
                    style={{ flex: 1, background: activeTicket?.mode === m ? 'var(--green-dim)' : 'var(--bg-card)', border: `1px solid ${activeTicket?.mode === m ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: activeTicket?.mode === m ? 'var(--green)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>{t.modeLabel}</div>
                    <div style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{t.potentialGain} €</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {activeTicket && (
          <div style={S.cardGreen}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>{activeTicket.modeLabel}</div>
              <ScoreRing score={activeTicket.globalScore} size={52} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Sélections', activeTicket.matchCount], ['Cote totale', activeTicket.totalOdd], ['Mise', `${activeTicket.stake} €`], ['Gain potentiel', `${activeTicket.potentialGain} €`]].map(([lbl, val]) => (
                <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl === 'Gain potentiel' ? 'var(--green)' : 'var(--text-primary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
              ))}
            </div>
            {activeTicket.matches.map((m, i) => (
              <div key={i} style={{ padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{m.sport} {m.home} vs {m.away}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>@{m.odd} · Score {m.kairosScore}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge text={m.riskLevel} color={m.riskLevel === 'Faible' ? 'var(--green)' : 'var(--gold)'} />
                    {m.valueBet?.isValue && <div style={{ color: '#FF6B00', fontSize: 9, marginTop: 2 }}>🔥 VALUE</div>}
                  </div>
                </div>
                {m.bestBookmaker && (
                  <div style={{ color: 'var(--gold)', fontSize: 10, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    🏆 Meilleure cote : {m.bestBookmaker.name} @{m.bestBookmaker.odd}
                  </div>
                )}
              </div>
            ))}
            {activeTicket.worstMatch && <div style={{ marginTop: 8, color: 'var(--gold)', fontSize: 11 }}>⚠️ Plus risqué : {activeTicket.worstMatch}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={{ ...S.btn, flex: 1 }} onClick={() => alert('Ticket sauvegardé !')}>💾 SAUVEGARDER</button>
              <button style={{ ...S.btnPlay, flex: 1 }}
                onClick={() => window.open(activeTicket.bestBookmaker?.url || 'https://www.unibet.be', '_blank')}>
                🎯 JOUER
              </button>
            </div>
          </div>
        )}

        {/* Ticket manuel */}
        {ticket.length > 0 && (
          <>
            <div style={S.section}>Mon ticket manuel ({ticket.length})</div>
            <div style={S.cardGreen}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>TICKET</div>
                <ScoreRing score={ticketScore} size={52} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['Sélections', ticket.length], ['Cote totale', totalOdd.toFixed(2)], ['Gain potentiel', `${potentialGain.toFixed(0)} €`], ['Bénéfice net', `+${(potentialGain - parseFloat(budget || 0)).toFixed(0)} €`]].map(([lbl, val]) => (
                  <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl.includes('Gain') || lbl.includes('Bénéfice') ? 'var(--green)' : 'var(--text-primary)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
                ))}
              </div>
              {ticket.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{ev.sport} {ev.home} vs {ev.away}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>@{ev.oddHome} · Score {ev.kairosScore}</div>
                  </div>
                  <button onClick={() => removeFromTicket(ev.id)} style={{ background: 'transparent', border: '1px solid #FF4D6D44', color: 'var(--red)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Retirer</button>
                </div>
              ))}
              {worstMatch && (
                <div style={{ ...S.cardGold, marginTop: 8, marginBottom: 0 }}>
                  <div style={{ color: 'var(--gold)', fontSize: 11 }}>⚠️ Match le plus risqué : {worstMatch.sport} {worstMatch.home} vs {worstMatch.away}</div>
                </div>
              )}
              <button style={{ ...S.btnPlay, marginTop: 12 }} onClick={() => window.open('https://www.unibet.be', '_blank')}>🎯 JOUER MAINTENANT</button>
            </div>
          </>
        )}
      </div>
    );
  };

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
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} capture="environment" />
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
        {importLoading ? <Loader text="GEMINI ANALYSE VOTRE TICKET..." /> : (
          <button style={{ ...S.btn, marginTop: 10 }} onClick={handleAnalyzeText} disabled={!importText.trim()}>ANALYSER</button>
        )}
      </div>
      {importResult && (
        <div>
          <div style={S.section}>Résultat de l'analyse</div>
          <div style={importResult.globalScore >= 80 ? S.cardGreen : S.cardGold}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[['Matchs', importResult.matchCount], ['Mise', `${importResult.stake || '?'} €`], ['Gain potentiel', `${Math.round(importResult.potentialGain || 0)} €`], ['Score global', `${importResult.globalScore}/100`]].map(([lbl, val]) => (
                <div key={lbl}><div style={S.label}>{lbl}</div><div style={{ color: lbl === 'Score global' ? (importResult.globalScore >= 80 ? 'var(--green)' : 'var(--gold)') : 'var(--text-primary)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{val}</div></div>
              ))}
            </div>
            {importResult.matches?.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{m.home} vs {m.away}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>@{m.odd}</div>
                </div>
                <div style={{ color: m.kairosScore >= 80 ? 'var(--green)' : 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.kairosScore}/100</div>
              </div>
            ))}
          </div>
          {importResult.optimization && (
            <div style={S.cardGreen}>
              <div style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💡 OPTIMISATION SUGGÉRÉE</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Retirer : {importResult.optimization.remove.join(', ')}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div><div style={S.label}>Nouveau score</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>{importResult.optimization.newScore}/100</div></div>
                <div><div style={S.label}>Amélioration</div><div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-mono)' }}>+{importResult.optimization.improvement} pts</div></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCoach = () => (
    <div style={{ paddingTop: 16 }}>
      <button style={S.backBtn} onClick={() => goTo(SCREENS.HOME)}>← Accueil</button>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20, letterSpacing: 2, margin: '12px 0 16px' }}>MON COACH KAIROS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[['Tickets', userStats?.totalBets || 0], ['Succès', `${userStats?.winRate || 0}%`], ['ROI', `${userStats?.roi > 0 ? '+' : ''}${userStats?.roi || 0}%`]].map(([lbl, val]) => (
          <div key={lbl} style={{ ...S.card, textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ color: 'var(--green)', fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-mono)' }}>{val}</div>
            <div style={{ ...S.label, marginBottom: 0, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={S.cardGreen}>
        <div style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>✅ VOUS RÉUSSISSEZ AVEC</div>
        {['Tickets 3 à 5 matchs', 'Cotes entre 1.20 et 1.60', 'Football international', 'Paris en semaine'].map(s => (
          <div key={s} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>✓ {s}</div>
        ))}
      </div>
      <div style={S.cardRed}>
        <div style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>❌ VOUS PERDEZ AVEC</div>
        {['Tickets de plus de 8 matchs', 'Paris de dernière minute', 'Favoris surestimés', 'MMA (ROI -34%)'].map(s => (
          <div key={s} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>✗ {s}</div>
        ))}
      </div>
      <div style={S.cardGold}>
        <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>💡 CONSEIL DU JOUR</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          « Votre historique montre que vous êtes 2× plus performant avec des tickets de 3-4 matchs. »
        </div>
      </div>
    </div>
  );

  const renderSilence = () => (
    <div style={{ paddingTop: 60, textAlign: 'center', padding: '60px 20px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔇</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 22, letterSpacing: 2, lineHeight: 1.4, marginBottom: 8 }}>AUCUNE OPPORTUNITÉ<br />PREMIUM AUJOURD'HUI</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, margin: '12px 0', letterSpacing: 1, lineHeight: 1.8, fontFamily: 'var(--font-mono)' }}>{stats.totalAnalyzed?.toLocaleString()} événements analysés</div>
      <div style={{ ...S.cardGold, margin: '24px 0', textAlign: 'center' }}>
        <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Recommandation</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>Conservez votre capital.<br />Les meilleures décisions sont parfois de ne pas jouer.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={S.btnGhost} onClick={() => { loadScanner(); goTo(SCREENS.HOME); }}>Réanalyser</button>
        <button style={{ ...S.btnGhost, color: 'var(--gold)', borderColor: '#FFD70044' }} onClick={() => { setMinScore(70); loadScanner(70); goTo(SCREENS.SCANNER); }}>Abaisser le seuil à 70</button>
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
        <title>KAIROS SPORT — Intelligence Sportive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={S.app} className="grid-bg">
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 18, letterSpacing: 3, fontFamily: 'var(--font-mono)' }}>⚡ KAIROS</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 8, letterSpacing: 3, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Trouver peu · Trouver le mieux</div>
            </div>
            {ticket.length > 0 && (
              <button style={{ background: 'var(--green-dim)', border: '1px solid var(--border-glow)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', color: 'var(--green)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }} onClick={() => goTo(SCREENS.GENERATOR)}>
                🎯 {ticket.length}
              </button>
            )}
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
