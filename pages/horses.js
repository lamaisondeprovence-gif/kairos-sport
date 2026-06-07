import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const C = {
  bg: '#07090f', bgBase: '#0b0e18', bgCard: '#0f1422', bgDeep: '#070a12',
  border: '#1a2035', borderGlow: '#FF6B0044',
  green: '#00FFB2', gold: '#FFD700', orange: '#FF6B00', red: '#FF4D6D', purple: '#9B59B6',
  textPrimary: '#e8eaf0', textSecondary: '#8892a4', textMuted: '#4a5568',
  fontMono: "'Courier New', monospace",
};

const S = {
  app: { background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: C.fontMono },
  shell: { width: '100%', maxWidth: 430, background: C.bgBase, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 14px 100px' },
  card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardOrange: { background: '#1a0d0020', border: `1px solid ${C.borderGlow}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGold: { background: '#1a150020', border: '1px solid #FFD70044', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGreen: { background: '#00FFB210', border: '1px solid #00FFB244', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardRed: { background: '#FF4D6D10', border: '1px solid #FF4D6D44', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: C.orange, color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGold: { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGhost: { background: 'transparent', color: C.orange, border: `1px solid ${C.borderGlow}`, borderRadius: 12, padding: '10px 16px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' },
  btnSmall: { background: 'transparent', color: C.orange, border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: '5px 10px', fontFamily: C.fontMono, fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnPlay: { background: 'linear-gradient(135deg, #FFD700, #FF6B00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '18px 20px', fontFamily: C.fontMono, fontWeight: 900, fontSize: 16, letterSpacing: 3, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  tab: (active) => ({ flex: 1, background: active ? '#FF6B0022' : 'transparent', color: active ? C.orange : C.textMuted, border: `1px solid ${active ? C.orange : C.border}`, borderRadius: 10, padding: '8px 4px', fontFamily: C.fontMono, fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }),
  pinBtn: (active) => ({ width: 70, height: 70, background: active ? C.orange : '#0f1422', border: `2px solid ${active ? C.orange : '#1a2035'}`, borderRadius: '50%', color: active ? '#07090f' : C.textPrimary, fontSize: 24, fontWeight: 700, cursor: 'pointer', fontFamily: C.fontMono, transition: 'all 0.15s' }),
};

const VIP_PIN_KEY = 'kairos_horses_pin';
const DEFAULT_PIN = '1234';

const KairosHorseBadge = ({ index, size = 'normal' }) => {
  const color = index >= 900 ? C.green : index >= 800 ? C.gold : index >= 700 ? C.orange : C.red;
  const icon = index >= 900 ? '🟢' : index >= 800 ? '🟡' : index >= 700 ? '🟠' : '🔴';
  const label = index >= 950 ? 'EXCEPTIONNEL' : index >= 900 ? 'TRÈS FORT' : index >= 850 ? 'BONNE COTE' : index >= 800 ? 'JOUABLE' : index >= 700 ? 'RISQUÉ' : 'ÉVITER';
  if (size === 'large') return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ color, fontWeight: 900, fontSize: 42, fontFamily: C.fontMono, lineHeight: 1 }}>{index}</div>
      <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 3, marginTop: 4 }}>/1000</div>
      <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ textAlign: 'center', flexShrink: 0 }}>
      <div style={{ color, fontWeight: 900, fontSize: 20, fontFamily: C.fontMono, lineHeight: 1 }}>{index}</div>
      <div style={{ color: C.textMuted, fontSize: 7 }}>/1000</div>
      <div style={{ fontSize: 13 }}>{icon}</div>
    </div>
  );
};

const Loader = ({ text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 16 }}>
    <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.orange}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2 }}>{text || 'ANALYSE EN COURS...'}</div>
  </div>
);

export default function HorsesPage() {
  const router = useRouter();
  const [screen, setScreen] = useState('pin'); // pin | vip | scanner | detail | quinté | jockeys | coach
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [vipPin, setVipPin] = useState('');
  const [isVip, setIsVip] = useState(false);

  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiSource, setApiSource] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [silenceMode, setSilenceMode] = useState(false);
  const [silenceMsg, setSilenceMsg] = useState('');
  const [coupAlert, setCoupAlert] = useState([]);
  const [budget, setBudget] = useState('100');
  const [misePerso, setMisePerso] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [allRacesData, setAllRacesData] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [lastRefresh, setLastRefresh] = useState('');
  const [history, setHistory] = useState([]);
  const refreshRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('kairos_auth') !== 'ok') {
        router.push('/login'); return;
      }
      // Charger PIN sauvegardé
      const savedPin = localStorage.getItem(VIP_PIN_KEY);
      if (savedPin) setVipPin(savedPin);
      else { localStorage.setItem(VIP_PIN_KEY, DEFAULT_PIN); setVipPin(DEFAULT_PIN); }
      // Charger budget
      const savedBudget = localStorage.getItem('kairos_horses_budget');
      if (savedBudget) setBudget(savedBudget);
      // Charger historique
      try {
        const h = localStorage.getItem('kairos_horses_history');
        if (h) setHistory(JSON.parse(h));
      } catch {}
    }
  }, []);

  // Auto-refresh toutes les 2 min en mode VIP
  useEffect(() => {
    if (isVip) {
      refreshRef.current = setInterval(() => { loadRaces(); }, 120000);
    }
    return () => clearInterval(refreshRef.current);
  }, [isVip]);

  const handlePinInput = (digit) => {
    if (pinAttempts >= 3) { setPinError('Trop de tentatives. Mode lecture seule activé.'); return; }
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      const correctPin = localStorage.getItem(VIP_PIN_KEY) || DEFAULT_PIN;
      if (newPin === correctPin) {
        setIsVip(true);
        setScreen('vip');
        setPin('');
        setPinError('');
        loadRaces();
        generateTicket();
      } else {
        setPinAttempts(a => a + 1);
        setPinError(`PIN incorrect (${pinAttempts + 1}/3)`);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handlePinDelete = () => setPin(p => p.slice(0, -1));

  const loadRaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/horses-live?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.races?.length > 0) {
        setRaces(data.races);
        setApiSource(data.source === 'eurotierce' ? '✅ EuroTiercé Live' : '📡 The Odds API');
        const coups = [];
        data.races.forEach(race => race.horses?.forEach(h => {
          if (h.odds_movement < -0.4) coups.push({ race: race.name, horse: h.name, odds: h.odds });
        }));
        setCoupAlert(coups);
        setLastRefresh(new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {}
    setLoading(false);
  };

  const generateTicket = async () => {
    setTicketLoading(true);
    setTicket(null);
    setSilenceMode(false);
    try {
      const res = await fetch(`/api/horses-ticket?budget=${budget}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.silence) { setSilenceMode(true); setSilenceMsg(data.message); }
        else {
          setTicket(data.bestRace); // Meilleure course
          setAllRacesData(data.allRaces || []); // Toutes les courses
        }
      }
    } catch {}
    setTicketLoading(false);
  };

  const saveToHistory = (t, result) => {
    try {
      const entry = { ...t, result, savedAt: new Date().toISOString(), id: Date.now() };
      const newH = [entry, ...history].slice(0, 30);
      setHistory(newH);
      localStorage.setItem('kairos_horses_history', JSON.stringify(newH));
    } catch {}
  };

  // ── ÉCRAN PIN ───────────────────────────────────────────────────
  const renderPin = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🐎</div>
      <div style={{ color: C.orange, fontWeight: 900, fontSize: 22, letterSpacing: 4, marginBottom: 4 }}>KAIROS VIP</div>
      <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: 40 }}>ENTREZ VOTRE CODE PIN</div>

      {/* Indicateur PIN */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < pin.length ? C.orange : C.border, transition: 'background 0.2s' }} />
        ))}
      </div>

      {pinError && <div style={{ color: C.red, fontSize: 11, marginBottom: 16, fontFamily: C.fontMono }}>{pinError}</div>}

      {/* Clavier PIN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button key={d} style={S.pinBtn(false)} onClick={() => handlePinInput(String(d))}>{d}</button>
        ))}
        <div />
        <button style={S.pinBtn(false)} onClick={() => handlePinInput('0')}>0</button>
        <button style={{ ...S.pinBtn(false), fontSize: 18 }} onClick={handlePinDelete}>⌫</button>
      </div>

      <div style={{ color: C.textMuted, fontSize: 9, marginTop: 24, textAlign: 'center', fontFamily: C.fontMono }}>
        Code par défaut : 1234<br />
        Modifiable dans les réglages
      </div>

      {pinAttempts >= 3 && (
        <button style={{ ...S.btnGhost, marginTop: 20, fontSize: 10 }} onClick={() => { setIsVip(false); setScreen('scanner'); loadRaces(); }}>
          Mode lecture seule →
        </button>
      )}
    </div>
  );

  // ── DASHBOARD VIP ───────────────────────────────────────────────
  const renderVip = () => (
    <div style={{ paddingTop: 16 }}>
      {/* Badge VIP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: '#FF6B0020', color: C.orange, border: `1px solid ${C.borderGlow}`, padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: C.fontMono }}>⚡ MODE VIP</span>
          {apiSource && <span style={{ color: C.green, fontSize: 9, fontFamily: C.fontMono }}>{apiSource}</span>}
        </div>
        {lastRefresh && <span style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>🔄 {lastRefresh}</span>}
      </div>

      {/* Bankroll */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontFamily: C.fontMono }}>BANKROLL</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={budget} onChange={e => { setBudget(e.target.value); localStorage.setItem('kairos_horses_budget', e.target.value); }}
            style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 16, flex: 1, outline: 'none' }} />
          <span style={{ color: C.textMuted, fontFamily: C.fontMono, fontSize: 14 }}>€</span>
          <button style={S.btnSmall} onClick={generateTicket}>🎯 ANALYSER</button>
        </div>
      </div>

      {ticketLoading && <Loader text="KAIROS ANALYSE TOUTES LES COURSES..." />}

      {!ticketLoading && silenceMode && (
        <div style={S.cardGold}>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔇 PAS D'OPPORTUNITÉ</div>
          <div style={{ color: C.textSecondary, fontSize: 12, lineHeight: 1.6 }}>{silenceMsg}</div>
          <button style={{ ...S.btnGhost, marginTop: 12 }} onClick={generateTicket}>🔄 Réanalyser</button>
        </div>
      )}

      {!ticketLoading && ticket && (
        <div>
          {/* Toutes les courses avec leurs tickets */}
          {(allRacesData.length > 0 ? allRacesData : [ticket]).map((raceData, ri) => (
            <div key={ri} style={{ marginBottom: 20 }}>
              {/* Header course */}
              <div style={{ background: 'linear-gradient(135deg, #1a0d0030, #0f142280)', border: `2px solid ${raceData.bestIndex >= 850 ? C.green : raceData.bestIndex >= 700 ? C.gold : C.orange}`, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, fontFamily: C.fontMono }}>{raceData.country} {raceData.track} · {raceData.time}</div>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15, marginTop: 2 }}>{raceData.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{raceData.distance} · {raceData.going} · {raceData.prize}</div>
                    {raceData.countdown?.label && (
                      <span style={{ color: raceData.countdown.urgent ? C.red : C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>⏱️ {raceData.countdown.label}</span>
                    )}
                  </div>
                  <KairosHorseBadge index={raceData.bestIndex} size="large" />
                </div>

                {/* Analyse narrative */}
                {raceData.narrative && (
                  <div style={{ background: '#FFD70010', borderRadius: 8, padding: '8px 10px', marginBottom: 10, border: '1px solid #FFD70020' }}>
                    <div style={{ color: C.gold, fontSize: 9, fontWeight: 700, marginBottom: 3 }}>💡 ANALYSE KAIROS</div>
                    <div style={{ color: C.textSecondary, fontSize: 11, lineHeight: 1.5 }}>{raceData.narrative}</div>
                  </div>
                )}

                {/* Évaluation tous les chevaux */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 6, fontFamily: C.fontMono }}>ÉVALUATION KAIROS — {raceData.nbParticipants} PARTANTS</div>
                  {(raceData.evaluation || []).map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                        <span style={{ color: i === 0 ? C.gold : C.textMuted, fontWeight: 900, fontFamily: C.fontMono, fontSize: 13, width: 20 }}>{e.num}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: e.isTrap ? C.red : C.textPrimary, fontWeight: 700, fontSize: 13 }}>{e.name}</div>
                          <div style={{ color: C.textMuted, fontSize: 8, fontFamily: C.fontMono }}>{e.jockey} · VH {e.vh} · {e.forme}</div>
                          <div style={{ color: C.textMuted, fontSize: 8, marginTop: 1 }}>{e.conseil}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ color: C.orange, fontWeight: 900, fontSize: 14, fontFamily: C.fontMono }}>@{e.odds}</div>
                        <div style={{ fontSize: 9, color: C.textMuted }}>{e.signal}</div>
                        <div style={{ color: e.kairosIndex >= 800 ? C.green : e.kairosIndex >= 700 ? C.gold : C.textMuted, fontSize: 10, fontWeight: 700, fontFamily: C.fontMono }}>{e.kairosIndex}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pièges */}
                {raceData.traps?.length > 0 && (
                  <div style={{ background: '#FF4D6D10', border: '1px solid #FF4D6D30', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                    <div style={{ color: C.red, fontSize: 9, fontWeight: 700, marginBottom: 3 }}>⚠️ PIÈGES</div>
                    {raceData.traps.map((t, i) => <div key={i} style={{ color: C.textMuted, fontSize: 10 }}>✗ {t.name} @{t.odds} — {t.conseil}</div>)}
                  </div>
                )}
              </div>

              {/* TOUS LES TYPES DE PARIS */}
              <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8, fontFamily: C.fontMono }}>TYPES DE PARIS DISPONIBLES</div>
              {(raceData.tickets || []).map((t, ti) => (
                <div key={ti} style={{ ...S.card, borderColor: t.recommended ? '#00FFB244' : C.border, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 16 }}>{t.emoji}</span>
                        <span style={{ color: t.recommended ? C.green : C.textPrimary, fontWeight: 700, fontSize: 14 }}>{t.type}</span>
                        {t.recommended && <span style={{ background: '#00FFB220', color: C.green, border: '1px solid #00FFB244', padding: '1px 8px', borderRadius: 10, fontSize: 8, fontWeight: 700 }}>RECOMMANDÉ</span>}
                      </div>
                      <div style={{ color: C.textMuted, fontSize: 10, marginTop: 3 }}>{t.conseil}</div>
                      <div style={{ color: C.textMuted, fontSize: 9, marginTop: 2, fontFamily: C.fontMono }}>{t.confiance}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: C.orange, fontWeight: 900, fontSize: 15, fontFamily: C.fontMono }}>{t.mise}€</div>
                      <div style={{ color: C.green, fontWeight: 700, fontSize: 13, fontFamily: C.fontMono }}>+{t.gainPotentiel}€</div>
                    </div>
                  </div>
                  {/* Chevaux du ticket */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                    {t.horses.map((h, hi) => (
                      <div key={hi} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ color: C.textPrimary, fontSize: 12 }}>{hi + 1}. {h.num}. {h.name}</span>
                        <span style={{ color: C.orange, fontSize: 12, fontFamily: C.fontMono }}>@{h.odds}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{ ...S.btnPlay, marginTop: 8, padding: '10px', fontSize: 11 }}
                    onClick={() => {
                      setSelectedTicketType(t);
                      setShowConfirm(true);
                    }}>
                    🎯 JOUER CE PARI →
                  </button>
                </div>
              ))}

              {/* Bouton EuroTiercé direct */}
              {raceData.deepLink && (
                <button style={{ ...S.btnGhost, width: '100%', marginBottom: 8 }}
                  onClick={() => window.open(raceData.deepLink, '_blank')}>
                  🔗 Ouvrir {raceData.name} sur EuroTiercé →
                </button>
              )}
            </div>
          ))}

          {/* Boutons globaux */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={{ ...S.btnGhost, flex: 1, fontSize: 10 }} onClick={generateTicket}>🔄 Recharger</button>
            <button style={{ background: '#25D36620', color: '#25D366', border: '1px solid #25D36644', borderRadius: 12, padding: '10px 8px', fontFamily: C.fontMono, fontSize: 10, cursor: 'pointer', flex: 1 }}
              onClick={() => {
                const t = selectedTicketType || ticket?.recommended;
                if (!t) return;
                const msg = `🐎 KAIROS HORSES\n${t.type} · ${t.horses[0]?.name} @${t.horses[0]?.odds}\nMise: ${t.mise}€ → +${t.gainPotentiel}€`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}>
              📱 WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Écran confirmation */}
      {showConfirm && selectedTicketType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000000cc', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.bgCard, border: `2px solid ${C.orange}`, borderRadius: 18, padding: 24, width: '100%', maxWidth: 380 }}>
            <div style={{ color: C.orange, fontWeight: 900, fontSize: 18, letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>⚡ CONFIRMER</div>
            <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{selectedTicketType.emoji} {selectedTicketType.type}</div>
            {selectedTicketType.horses.map((h, i) => (
              <div key={i} style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', padding: '2px 0' }}>{h.num}. {h.name} @{h.odds}</div>
            ))}
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>CHOISIR LA MISE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[2, 5, 10, 20, 50, selectedTicketType.mise].filter((v, i, a) => a.indexOf(v) === i).map(m => (
                  <button key={m} style={{ background: (parseFloat(misePerso) || selectedTicketType.mise) == m ? C.orange : C.bgDeep, color: (parseFloat(misePerso) || selectedTicketType.mise) == m ? '#07090f' : C.textPrimary, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontFamily: C.fontMono, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setMisePerso(String(m))}>
                    {m}€
                  </button>
                ))}
              </div>
              <div style={{ color: C.green, fontSize: 15, marginTop: 10, fontFamily: C.fontMono, fontWeight: 700, textAlign: 'center' }}>
                Gain estimé : +{((parseFloat(misePerso || selectedTicketType.mise) * selectedTicketType.horses[0]?.odds) * 0.9).toFixed(2)}€
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { setShowConfirm(false); setMisePerso(''); }}>Annuler</button>
              <button style={{ ...S.btnPlay, flex: 2, padding: '14px', fontSize: 13 }} onClick={() => {
                setShowConfirm(false);
                setMisePerso('');
                window.open(ticket?.deepLink || 'https://www.eurotierce.be', '_blank');
              }}>🎯 JOUER</button>
            </div>
          </div>
        </div>
      )}

      {/* Alertes coups */}
      {coupAlert.length > 0 && (
        <div style={{ ...S.cardRed, marginTop: 8 }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>🚨 COUPS DÉTECTÉS</div>
          {coupAlert.map((c, i) => (
            <div key={i} style={{ color: C.textSecondary, fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.orange }}>{c.horse}</span> — {c.race} · @{c.odds}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── SCANNER ─────────────────────────────────────────────────────
  const renderScanner = () => (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: apiSource ? C.green : C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>
          {apiSource || '⚠️ Non connecté'}
        </span>
        <button style={S.btnSmall} onClick={loadRaces}>🔄 Actualiser</button>
      </div>

      {loading ? <Loader text="SCAN EUROTIERCÉ EN COURS..." /> : races.length === 0 ? (
        <div style={{ ...S.cardGold, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🐎</div>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Aucune course trouvée</div>
          <div style={{ color: C.textMuted, fontSize: 11 }}>EuroTiercé hors ligne ou pas de course aujourd'hui</div>
          <button style={{ ...S.btnGhost, marginTop: 12 }} onClick={loadRaces}>Réessayer</button>
        </div>
      ) : (
        races.map(race => {
          const top3 = race.horses?.slice(0, 3) || [];
          const best = top3[0];
          return (
            <div key={race.id} style={{ ...S.card, cursor: 'pointer', borderColor: race.source === 'eurotierce' ? '#00FFB230' : C.border }}
              onClick={() => { setSelectedRace(race); setScreen('detail'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14 }}>{race.country}</span>
                    <span style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{race.track}</span>
                    <span style={{ color: C.orange, fontSize: 9, background: '#FF6B0015', padding: '1px 6px', borderRadius: 10, fontFamily: C.fontMono }}>{race.time}</span>
                    {race.source === 'eurotierce' && <span style={{ color: C.green, fontSize: 8, fontFamily: C.fontMono }}>✅ LIVE</span>}
                  </div>
                  <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{race.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{race.distance} · {race.going}</div>
                </div>
                {best && <KairosHorseBadge index={best.kairosIndex} />}
              </div>
              {top3.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                  {top3.map((h, i) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: i === 0 ? C.gold : C.textMuted, fontWeight: 700, fontFamily: C.fontMono, fontSize: 12 }}>#{i + 1}</span>
                        <div>
                          <div style={{ color: C.textPrimary, fontSize: 12 }}>{h.num}. {h.name}</div>
                          <div style={{ color: C.textMuted, fontSize: 8, fontFamily: C.fontMono }}>{h.jockey}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: C.orange, fontWeight: 700, fontFamily: C.fontMono, fontSize: 13 }}>@{h.odds}</div>
                        {h.odds_movement < -0.3 && <div style={{ color: C.red, fontSize: 8 }}>🔥 COUP</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {race.deepLink && (
                <button style={{ ...S.btnSmall, width: '100%', marginTop: 8, padding: '7px', textAlign: 'center' }}
                  onClick={e => { e.stopPropagation(); window.open(race.deepLink, '_blank'); }}>
                  🎯 Voir sur EuroTiercé →
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // ── DÉTAIL COURSE ───────────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedRace) return <div style={{ padding: 20, color: C.textMuted }}>Sélectionne une course</div>;
    return (
      <div style={{ paddingTop: 16 }}>
        <button style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 11, padding: '8px 0 14px', fontFamily: C.fontMono, textTransform: 'uppercase', letterSpacing: 2 }}
          onClick={() => setScreen('scanner')}>← Retour</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18 }}>{selectedRace.name}</div>
            <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono }}>{selectedRace.country} {selectedRace.track} · {selectedRace.time}</div>
            <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono }}>{selectedRace.distance} · {selectedRace.going}</div>
          </div>
          {selectedRace.deepLink && (
            <button style={{ ...S.btnSmall, color: C.gold, borderColor: '#FFD70044' }}
              onClick={() => window.open(selectedRace.deepLink, '_blank')}>
              Parier →
            </button>
          )}
        </div>

        {(selectedRace.horses || []).map((h, i) => (
          <div key={h.id} style={{ ...S.card, borderColor: i === 0 ? '#FF6B0044' : C.border, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: i === 0 ? C.gold : C.textMuted, fontWeight: 900, fontSize: 15, fontFamily: C.fontMono }}>{h.num}</span>
                  <div>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14 }}>{h.name}</div>
                    <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{h.jockey} · {h.trainer}</div>
                  </div>
                  {i === 0 && <span style={{ background: '#FFD70020', color: C.gold, border: '1px solid #FFD70044', padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>🏆 KAIROS #1</span>}
                  {h.odds_movement < -0.4 && <span style={{ background: '#FF4D6D20', color: C.red, border: '1px solid #FF4D6D44', padding: '2px 8px', borderRadius: 10, fontSize: 9 }}>🔥 COUP</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 8 }}>
                  {[['Forme', h.forme], ['Cote', `@${h.odds}`], ['VH', h.vh || 0], ['Âge', `${h.age}a`]].map(([l, v]) => (
                    <div key={l} style={{ background: C.bgDeep, borderRadius: 7, padding: '5px 4px', textAlign: 'center' }}>
                      <div style={{ color: C.orange, fontWeight: 700, fontSize: 10, fontFamily: C.fontMono }}>{v}</div>
                      <div style={{ color: C.textMuted, fontSize: 7 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <KairosHorseBadge index={h.kairosIndex} size="large" />
            </div>
          </div>
        ))}

        {selectedRace.deepLink && (
          <button style={S.btnPlay} onClick={() => window.open(selectedRace.deepLink, '_blank')}>
            🎯 PARIER SUR CETTE COURSE →
          </button>
        )}
      </div>
    );
  };

  // ── JOCKEYS ─────────────────────────────────────────────────────
  const renderJockeys = () => {
    const jockeys = [
      { name: 'C. Soumillon', wins: 89, pct: 28.5, form: '↑', flag: '🇧🇪' },
      { name: 'C. Demuro', wins: 71, pct: 26.5, form: '↑', flag: '🇮🇹' },
      { name: 'M. Guyon', wins: 84, pct: 25.9, form: '→', flag: '🇫🇷' },
      { name: 'A. Pouchin', wins: 63, pct: 24.4, form: '↑', flag: '🇫🇷' },
      { name: 'L. Dettori', wins: 54, pct: 23.5, form: '↓', flag: '🇮🇹' },
      { name: 'R. Moore', wins: 61, pct: 23.1, form: '→', flag: '🇬🇧' },
      { name: 'O. Peslier', wins: 48, pct: 22.0, form: '↑', flag: '🇫🇷' },
      { name: 'M. Barzalona', wins: 41, pct: 20.7, form: '↓', flag: '🇫🇷' },
    ];
    return (
      <div style={{ paddingTop: 16 }}>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>INDICE JOCKEY</div>
        <div style={{ ...S.cardGold, marginBottom: 12 }}>
          <div style={{ color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>💡 SIGNAL FORT</div>
          <div style={{ color: C.textSecondary, fontSize: 11, lineHeight: 1.6 }}>Jockey Top 5 + cheval coté &gt;6.0 = opportunité cachée. KAIROS détecte automatiquement.</div>
        </div>
        {jockeys.map((j, i) => (
          <div key={j.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ color: i < 3 ? C.gold : C.textMuted, fontWeight: 900, fontSize: 15, fontFamily: C.fontMono, width: 24 }}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14 }}>{j.flag} {j.name}</div>
              <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{j.wins} victoires cette saison</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: C.orange, fontWeight: 900, fontSize: 17, fontFamily: C.fontMono }}>{j.pct}%</div>
              <div style={{ fontSize: 13, color: j.form === '↑' ? C.green : j.form === '↓' ? C.red : C.gold }}>{j.form}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── COACH ───────────────────────────────────────────────────────
  const renderCoach = () => {
    const wins = history.filter(h => h.result === 'win');
    const losses = history.filter(h => h.result === 'loss');
    const roi = history.length > 0 ? ((wins.reduce((a, h) => a + (h.gainPotentiel || 0), 0) - losses.reduce((a, h) => a + (h.mise || 0), 0)) / Math.max(history.reduce((a, h) => a + (h.mise || 0), 0), 1) * 100).toFixed(1) : 0;
    return (
      <div style={{ paddingTop: 16 }}>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 14 }}>COACH HIPPIQUE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[['Tickets', history.length], ['Victoires', wins.length], ['ROI', `${roi > 0 ? '+' : ''}${roi}%`]].map(([l, v]) => (
            <div key={l} style={{ ...S.card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ color: C.orange, fontWeight: 900, fontSize: 18, fontFamily: C.fontMono }}>{v}</div>
              <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ ...S.cardGreen, marginBottom: 10 }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>✅ RÈGLES D'OR</div>
          {['Ne jamais dépasser 8% bankroll (Kelly)', 'Suivre uniquement Indice >850', 'Éviter les favoris <1.5 — pas de value', 'Maximum 2 courses par jour', 'VH élevé + jockey top = signal fort'].map(r => (
            <div key={r} style={{ color: C.textSecondary, fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>✓ {r}</div>
          ))}
        </div>
        <div style={{ ...S.cardRed, marginBottom: 10 }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>🚨 PIÈGES</div>
          {['Miser après 3 pertes consécutives', 'Sur-favori <1.3 = value zéro', 'VH = 0 = premier départ = inconnue', 'Ignorer la variation des cotes'].map(r => (
            <div key={r} style={{ color: C.textSecondary, fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>✗ {r}</div>
          ))}
        </div>
        <div style={S.cardGold}>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>💰 MISE KELLY AUJOURD'HUI</div>
          <div style={{ color: C.textPrimary, fontSize: 22, fontWeight: 900, fontFamily: C.fontMono }}>{(parseFloat(budget || 0) * 0.06).toFixed(2)}€</div>
          <div style={{ color: C.textMuted, fontSize: 9, marginTop: 4 }}>= 6% de {budget}€ (Kelly conservateur)</div>
        </div>
        {history.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: 8, fontFamily: C.fontMono }}>HISTORIQUE</div>
            {history.slice(0, 5).map(h => (
              <div key={h.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 6 }}>
                <div>
                  <div style={{ color: C.textPrimary, fontSize: 12 }}>{h.horses?.[0]?.name || 'Ticket'}</div>
                  <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{h.race?.track} · {h.mise}€</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {h.result === 'pending' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ ...S.btnSmall, color: C.green, borderColor: '#00FFB244', fontSize: 8, padding: '3px 8px' }} onClick={() => saveToHistory(h, 'win')}>✓ Gagné</button>
                      <button style={{ ...S.btnSmall, color: C.red, borderColor: '#FF4D6D44', fontSize: 8, padding: '3px 8px' }} onClick={() => saveToHistory(h, 'loss')}>✗ Perdu</button>
                    </div>
                  )}
                  {h.result !== 'pending' && <span style={{ color: h.result === 'win' ? C.green : C.red, fontSize: 12 }}>{h.result === 'win' ? '✅' : '❌'}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── RÉGLAGES PIN ────────────────────────────────────────────────
  const renderSettings = () => {
    const [newPin, setNewPin] = useState('');
    return (
      <div style={{ paddingTop: 16 }}>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>RÉGLAGES VIP</div>
        <div style={S.card}>
          <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>CHANGER LE CODE PIN</div>
          <input value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={4} type="number"
            placeholder="Nouveau PIN (4 chiffres)"
            style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 18, width: '100%', outline: 'none', letterSpacing: 8, textAlign: 'center', marginBottom: 10 }} />
          <button style={S.btn} onClick={() => {
            if (newPin.length === 4) {
              localStorage.setItem(VIP_PIN_KEY, newPin);
              setVipPin(newPin);
              alert('PIN mis à jour !');
              setNewPin('');
            }
          }}>Sauvegarder</button>
        </div>
        <button style={{ ...S.btnGhost, width: '100%', marginTop: 12 }} onClick={() => { setIsVip(false); setScreen('pin'); setPin(''); }}>
          🔒 Verrouiller
        </button>
      </div>
    );
  };

  const tabs = isVip
    ? [
        { id: 'vip', icon: '⚡', label: 'VIP' },
        { id: 'scanner', icon: '🐎', label: 'Courses' },
        { id: 'detail', icon: '🔍', label: 'Analyse' },
        { id: 'jockeys', icon: '👑', label: 'Jockeys' },
        { id: 'coach', icon: '📊', label: 'Coach' },
      ]
    : [
        { id: 'scanner', icon: '🐎', label: 'Courses' },
        { id: 'detail', icon: '🔍', label: 'Analyse' },
        { id: 'jockeys', icon: '👑', label: 'Jockeys' },
        { id: 'coach', icon: '📊', label: 'Coach' },
      ];

  const renderContent = () => {
    switch (screen) {
      case 'pin': return renderPin();
      case 'vip': return renderVip();
      case 'scanner': return renderScanner();
      case 'detail': return renderDetail();
      case 'jockeys': return renderJockeys();
      case 'coach': return renderCoach();
      case 'settings': return renderSettings();
      default: return renderPin();
    }
  };

  return (
    <>
      <Head>
        <title>KAIROS HORSES — Intelligence Hippique VIP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
      <div style={S.app}>
        <div style={S.shell}>
          <div style={S.header}>
            <div>
              <div style={{ color: C.orange, fontWeight: 700, fontSize: 18, letterSpacing: 3, fontFamily: C.fontMono }}>
                🐎 KAIROS HORSES {isVip && <span style={{ color: C.gold, fontSize: 11 }}>⚡VIP</span>}
              </div>
              <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 2, fontFamily: C.fontMono, textTransform: 'uppercase' }}>
                {isVip ? 'Mode VIP · EuroTiercé Live' : 'Intelligence Hippique · Belgique'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isVip && <button style={S.btnSmall} onClick={() => setScreen('settings')}>⚙️</button>}
              <a href="/" style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', color: C.textMuted, fontFamily: C.fontMono, fontSize: 9, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>← KAIROS</a>
            </div>
          </div>

          <div style={S.scroll}>{renderContent()}</div>

          <div style={{ background: C.bgDeep, padding: '5px 16px 6px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 1, fontFamily: C.fontMono }}>Aucun pari n'est garanti · Jouez responsable · 18+</div>
          </div>

          {screen !== 'pin' && (
            <div style={{ background: C.bgDeep, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100 }}>
              {tabs.map(t => (
                <button key={t.id} style={S.tab(screen === t.id)} onClick={() => setScreen(t.id)}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                  <div>{t.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
