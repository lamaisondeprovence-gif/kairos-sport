import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const C = {
  bg: '#07090f',
  bgBase: '#0b0e18',
  bgCard: '#0f1422',
  bgDeep: '#070a12',
  border: '#1a2035',
  borderGlow: '#FF6B0044',
  green: '#00FFB2',
  gold: '#FFD700',
  orange: '#FF6B00',
  red: '#FF4D6D',
  purple: '#9B59B6',
  textPrimary: '#e8eaf0',
  textSecondary: '#8892a4',
  textMuted: '#4a5568',
  fontMono: "'Courier New', monospace",
};

const S = {
  app: { background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: C.fontMono },
  shell: { width: '100%', maxWidth: 430, background: C.bgBase, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 14px 100px' },
  card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardOrange: { background: '#1a0d0044', border: `1px solid ${C.borderGlow}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGold: { background: '#1a150044', border: '1px solid #FFD70044', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGreen: { background: '#00FFB210', border: '1px solid #00FFB244', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardRed: { background: '#FF4D6D10', border: '1px solid #FF4D6D44', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: C.orange, color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGhost: { background: 'transparent', color: C.orange, border: `1px solid ${C.borderGlow}`, borderRadius: 12, padding: '10px 16px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' },
  btnSmall: { background: 'transparent', color: C.orange, border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: '5px 10px', fontFamily: C.fontMono, fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 },
  btnGold: { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  label: { color: C.textMuted, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontFamily: C.fontMono },
  tab: (active) => ({ flex: 1, background: active ? '#FF6B0022' : 'transparent', color: active ? C.orange : C.textMuted, border: `1px solid ${active ? C.orange : C.border}`, borderRadius: 10, padding: '8px 4px', fontFamily: C.fontMono, fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }),
};

// Indice KAIROS Hippique /1000
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
      <div style={{ color: C.textMuted, fontSize: 7, fontFamily: C.fontMono }}>/1000</div>
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

// Calcul indice KAIROS Hippique
function computeHorseKairos(horse) {
  let score = 500;
  // Forme récente (30 pts max)
  const formScore = horse.form ? horse.form.split('').reduce((a, c) => a + (c === '1' ? 6 : c === '2' ? 4 : c === '3' ? 2 : c === 'P' ? -2 : 0), 0) : 0;
  score += Math.min(formScore * 5, 150);
  // Terrain (20 pts)
  if (horse.going_preference === horse.going) score += 100;
  else if (horse.going_preference === 'any') score += 50;
  // Distance préférée (15 pts)
  if (horse.distance_preference === 'yes') score += 75;
  // Jockey top (10 pts)
  if (horse.jockey_win_rate > 0.15) score += 60;
  else if (horse.jockey_win_rate > 0.10) score += 30;
  // Variation cote (value bet)
  if (horse.odds_movement < -0.3) score += 80; // cote qui chute = signal fort
  else if (horse.odds_movement > 0.3) score -= 40;
  // Entraîneur en forme
  if (horse.trainer_form > 0.2) score += 35;
  // Blessure récente
  if (horse.injury_days && horse.injury_days < 30) score -= 80;
  return Math.min(Math.max(Math.round(score), 200), 1000);
}

// Données démo enrichies
function generateDemoRaces() {
  const today = new Date();
  const fmt = (d) => d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
  const addHours = (h) => { const d = new Date(today); d.setHours(today.getHours() + h); return fmt(d); };

  return [
    {
      id: 'r1', name: 'Prix de Diane', track: 'Chantilly', country: '🇫🇷', time: addHours(1),
      distance: '2100m', going: 'Bon', category: 'Groupe 1', prize: '500 000€',
      type: 'quinté',
      horses: [
        { id: 1, num: 1, name: 'Étoile du Soir', jockey: 'C. Soumillon', trainer: 'A. Fabre', form: '11213', odds: 2.8, odds_movement: -0.4, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.22, trainer_form: 0.28, weight: 56, age: 4 },
        { id: 2, num: 2, name: 'Belle Alliance', jockey: 'O. Peslier', trainer: 'H. de Nicolay', form: '21121', odds: 3.5, odds_movement: -0.2, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.18, trainer_form: 0.22, weight: 56, age: 4 },
        { id: 3, num: 3, name: 'Rose Mystique', jockey: 'T. Piccone', trainer: 'J.C. Rouget', form: '31223', odds: 5.2, odds_movement: 0.1, going_preference: 'Souple', distance_preference: 'no', jockey_win_rate: 0.14, trainer_form: 0.18, weight: 56, age: 4 },
        { id: 4, num: 4, name: 'Ondine de Mer', jockey: 'M. Guyon', trainer: 'F. Rossi', form: '12312', odds: 4.1, odds_movement: -0.15, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.16, trainer_form: 0.24, weight: 56, age: 4 },
        { id: 5, num: 5, name: 'Lune Dorée', jockey: 'A. Lemaire', trainer: 'Y. Barberot', form: '23134', odds: 7.5, odds_movement: 0.3, going_preference: 'Lourd', distance_preference: 'no', jockey_win_rate: 0.12, trainer_form: 0.15, weight: 56, age: 4 },
        { id: 6, num: 6, name: 'Tempête de Sable', jockey: 'C. Demuro', trainer: 'E. Lellouche', form: '32211', odds: 6.0, odds_movement: -0.1, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.19, trainer_form: 0.20, weight: 56, age: 4 },
        { id: 7, num: 7, name: 'Aurore Boréale', jockey: 'S. Pasquier', trainer: 'C. Laffon-Parias', form: '41312', odds: 9.0, odds_movement: 0.5, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.13, trainer_form: 0.17, weight: 56, age: 4 },
      ]
    },
    {
      id: 'r2', name: 'Grand Prix de Bruxelles', track: 'Groenendael', country: '🇧🇪', time: addHours(2),
      distance: '1800m', going: 'Bon à Souple', category: 'Groupe 2', prize: '120 000€',
      type: 'normal',
      horses: [
        { id: 8, num: 1, name: 'Diamond King', jockey: 'C. Soumillon', trainer: 'W. Mongil', form: '12111', odds: 1.9, odds_movement: -0.6, going_preference: 'Bon à Souple', distance_preference: 'yes', jockey_win_rate: 0.22, trainer_form: 0.30, weight: 59, age: 5 },
        { id: 9, num: 2, name: 'Belgian Pride', jockey: 'F. Tylicki', trainer: 'J. Bolger', form: '22312', odds: 3.2, odds_movement: 0.1, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.15, trainer_form: 0.19, weight: 57, age: 6 },
        { id: 10, num: 3, name: 'Black Thunder', jockey: 'S. Foley', trainer: 'A. O\'Brien', form: '31121', odds: 4.8, odds_movement: -0.3, going_preference: 'Souple', distance_preference: 'no', jockey_win_rate: 0.17, trainer_form: 0.25, weight: 58, age: 5 },
        { id: 11, num: 4, name: 'Midnight Storm', jockey: 'L. Dettori', trainer: 'J. Gosden', form: '11213', odds: 4.5, odds_movement: -0.8, going_preference: 'Bon à Souple', distance_preference: 'yes', jockey_win_rate: 0.21, trainer_form: 0.29, weight: 58, age: 5 },
        { id: 12, num: 5, name: 'Silver Arrow', jockey: 'R. Moore', trainer: 'A. O\'Brien', form: '23141', odds: 6.5, odds_movement: 0.2, going_preference: 'Bon', distance_preference: 'yes', jockey_win_rate: 0.20, trainer_form: 0.26, weight: 57, age: 6 },
      ]
    },
    {
      id: 'r3', name: 'Royal Ascot — Gold Cup', track: 'Ascot', country: '🇬🇧', time: addHours(3),
      distance: '4000m', going: 'Good to Firm', category: 'Groupe 1', prize: '800 000€',
      type: 'normal',
      horses: [
        { id: 13, num: 1, name: 'Stradivarius', jockey: 'F. Dettori', trainer: 'J. Gosden', form: '11111', odds: 2.2, odds_movement: -0.3, going_preference: 'Good to Firm', distance_preference: 'yes', jockey_win_rate: 0.22, trainer_form: 0.31, weight: 60, age: 8 },
        { id: 14, num: 2, name: 'Trueshan', jockey: 'H. Davies', trainer: 'A. King', form: '12211', odds: 3.0, odds_movement: -0.1, going_preference: 'Soft', distance_preference: 'yes', jockey_win_rate: 0.14, trainer_form: 0.22, weight: 60, age: 7 },
        { id: 15, num: 3, name: 'Kyprios', jockey: 'R. Moore', trainer: 'A. O\'Brien', form: '11121', odds: 2.8, odds_movement: -0.5, going_preference: 'Good', distance_preference: 'yes', jockey_win_rate: 0.20, trainer_form: 0.28, weight: 60, age: 6 },
        { id: 16, num: 4, name: 'Nate The Great', jockey: 'P. Dobbs', trainer: 'J. Ryan', form: '22312', odds: 12.0, odds_movement: 0.0, going_preference: 'Good to Firm', distance_preference: 'yes', jockey_win_rate: 0.11, trainer_form: 0.15, weight: 60, age: 7 },
        { id: 17, num: 5, name: 'Stay Alert', jockey: 'O. Murphy', trainer: 'D. Menuisier', form: '32221', odds: 8.0, odds_movement: -0.4, going_preference: 'Good to Firm', distance_preference: 'yes', jockey_win_rate: 0.15, trainer_form: 0.20, weight: 60, age: 6 },
        { id: 18, num: 6, name: 'Courage Mon Ami', jockey: 'T. Marquand', trainer: 'R. Beckett', form: '23133', odds: 15.0, odds_movement: 0.8, going_preference: 'Soft', distance_preference: 'no', jockey_win_rate: 0.13, trainer_form: 0.16, weight: 60, age: 7 },
      ]
    }
  ];
}

export default function HorsesPage() {
  const router = useRouter();
  const [tab, setTab] = useState('scanner');
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [quinteCombo, setQuinteCombo] = useState(null);
  const [quinteLoading, setQuinteLoading] = useState(false);
  const [coupAlert, setCoupAlert] = useState(null);
  const [budget, setBudget] = useState('20');
  const [apiSource, setApiSource] = useState('demo');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      router.push('/login');
      return;
    }
    loadRaces();
  }, []);

  const loadRaces = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/horses-odds?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();

      let enriched = [];
      if (data.success && data.races && data.races.length > 0) {
        enriched = data.races;
        setApiSource(data.usedDemo ? 'demo' : `✅ Cotes réelles · The Odds API`);
      } else {
        const demo = generateDemoRaces();
        enriched = demo.map(race => ({
          ...race,
          horses: race.horses.map(h => ({ ...h, kairosIndex: computeHorseKairos(h) })).sort((a, b) => b.kairosIndex - a.kairosIndex)
        }));
        setApiSource('demo');
      }

      setRaces(enriched);
      const coups = [];
      enriched.forEach(race => {
        race.horses.forEach(h => {
          if (h.odds_movement < -0.4) coups.push({ race: race.name, horse: h.name, movement: h.odds_movement, odds: h.odds });
        });
      });
      if (coups.length > 0) setCoupAlert(coups);
    } catch (e) {
      const demo = generateDemoRaces();
      const enriched = demo.map(race => ({
        ...race,
        horses: race.horses.map(h => ({ ...h, kairosIndex: computeHorseKairos(h) })).sort((a, b) => b.kairosIndex - a.kairosIndex)
      }));
      setRaces(enriched);
      setApiSource('demo');
    }
    setLoading(false);
  };

  const generateQuinte = () => {
    const quinteRace = races.find(r => r.type === 'quinté');
    if (!quinteRace) return;
    setQuinteLoading(true);
    setTimeout(() => {
      const top = quinteRace.horses.slice(0, 5);
      setQuinteCombo({
        race: quinteRace.name,
        track: quinteRace.track,
        time: quinteRace.time,
        sure: { horses: top.slice(0, 3).map(h => `${h.num}. ${h.name}`), cost: 3.0, gain: 450 },
        equilibre: { horses: top.slice(0, 4).map(h => `${h.num}. ${h.name}`), cost: 12.0, gain: 1200 },
        audacieux: { horses: top.map(h => `${h.num}. ${h.name}`), cost: 60.0, gain: 8500 },
        analyse: `${top[0].name} domine avec un indice KAIROS de ${top[0].kairosIndex}/1000. Sa forme récente (${top[0].form}) sur terrain ${quinteRace.going} est excellente. Le jockey ${top[0].jockey} affiche ${(top[0].jockey_win_rate * 100).toFixed(0)}% de victoires cette saison. Les cotes ont chuté de ${Math.abs(top[0].odds_movement * 100).toFixed(0)}% — signal fort détecté 🔥`
      });
      setQuinteLoading(false);
      setTab('quinté');
    }, 1500);
  };

  const renderScanner = () => (
    <div style={{ paddingTop: 16 }}>
      {/* Badge source + refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: apiSource === 'demo' ? C.textMuted : C.green, fontSize: 9, fontFamily: C.fontMono, letterSpacing: 1 }}>
          {apiSource === 'demo' ? '⚠️ MODE DÉMO' : apiSource}
        </span>
        <button style={{ ...S.btnSmall }} onClick={loadRaces}>🔄 Actualiser</button>
      </div>
      {/* Alerte coups */}
      {coupAlert && coupAlert.length > 0 && (
        <div style={{ ...S.cardRed, marginBottom: 12 }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>🚨 COUPS DÉTECTÉS</div>
          {coupAlert.map((c, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: '6px 0', color: C.textSecondary, fontSize: 12 }}>
              <span style={{ color: C.orange, fontWeight: 700 }}>{c.horse}</span> — {c.race}
              <span style={{ color: C.red, marginLeft: 8, fontFamily: C.fontMono }}>cote {c.odds} ↘ {(Math.abs(c.movement) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Bouton Quinté */}
      <button style={{ ...S.btnGold, marginBottom: 12 }} onClick={generateQuinte} disabled={quinteLoading}>
        {quinteLoading ? '⏳ ANALYSE QUINTÉ...' : '🏆 GÉNÉRER QUINTÉ+ DU JOUR'}
      </button>

      {loading ? <Loader text="SCAN DES COURSES EN COURS..." /> : (
        races.map(race => {
          const top3 = race.horses.slice(0, 3);
          const best = top3[0];
          return (
            <div key={race.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => { setSelectedRace(race); setTab('detail'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{race.country}</span>
                    <span style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono, letterSpacing: 1 }}>{race.track}</span>
                    <span style={{ color: C.orange, fontSize: 9, fontFamily: C.fontMono, background: '#FF6B0015', padding: '1px 6px', borderRadius: 10 }}>{race.time}</span>
                    {race.type === 'quinté' && <span style={{ color: C.gold, fontSize: 9, fontFamily: C.fontMono, background: '#FFD70015', padding: '1px 6px', borderRadius: 10 }}>QUINTÉ+</span>}
                  </div>
                  <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{race.name}</div>
                  <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono }}>{race.distance} · {race.going} · {race.category}</div>
                </div>
                <KairosHorseBadge index={best?.kairosIndex || 0} />
              </div>
              {/* Top 3 sélections */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                <div style={{ ...S.label, marginBottom: 6 }}>🏆 Top 3 Sélections KAIROS</div>
                {top3.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                      <span style={{ color: i === 0 ? C.gold : C.textMuted, fontWeight: 700, fontFamily: C.fontMono, fontSize: 13, width: 20 }}>#{i + 1}</span>
                      <div>
                        <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>{h.num}. {h.name}</div>
                        <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{h.jockey}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: C.orange, fontWeight: 700, fontSize: 13, fontFamily: C.fontMono }}>@{h.odds}</div>
                      {h.odds_movement < -0.3 && <div style={{ color: C.red, fontSize: 9 }}>🔥 COUP</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={{ ...S.btnSmall, flex: 1 }} onClick={e => { e.stopPropagation(); setSelectedRace(race); setTab('detail'); }}>Analyser</button>
                <button style={{ ...S.btnSmall, flex: 1, color: C.gold, borderColor: '#FFD70044' }} onClick={e => { e.stopPropagation(); }}>🎯 Parier</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderDetail = () => {
    if (!selectedRace) return <div style={{ padding: 20, color: C.textMuted }}>Sélectionne une course</div>;
    return (
      <div style={{ paddingTop: 16 }}>
        <button style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 11, letterSpacing: 2, padding: '8px 0 14px', fontFamily: C.fontMono, textTransform: 'uppercase' }} onClick={() => setTab('scanner')}>← Retour</button>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>{selectedRace.name}</div>
        <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono, marginBottom: 16 }}>{selectedRace.country} {selectedRace.track} · {selectedRace.time} · {selectedRace.distance} · {selectedRace.going}</div>

        {selectedRace.horses.map((h, i) => {
          const idx = h.kairosIndex;
          const idxColor = idx >= 900 ? C.green : idx >= 800 ? C.gold : idx >= 700 ? C.orange : C.red;
          const isTop = i === 0;
          return (
            <div key={h.id} style={{ ...S.card, borderColor: isTop ? '#FF6B0044' : C.border, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: isTop ? C.gold : C.textMuted, fontWeight: 900, fontSize: 16, fontFamily: C.fontMono }}>{h.num}</span>
                    <div>
                      <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15 }}>{h.name}</div>
                      <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono }}>{h.jockey} · {h.trainer}</div>
                    </div>
                    {isTop && <span style={{ background: '#FFD70020', color: C.gold, border: '1px solid #FFD70044', padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>🏆 FAVORI KAIROS</span>}
                    {h.odds_movement < -0.4 && <span style={{ background: '#FF4D6D20', color: C.red, border: '1px solid #FF4D6D44', padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>🔥 COUP</span>}
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    {[
                      ['Forme', h.form],
                      ['Cote', `@${h.odds}`],
                      ['Poids', `${h.weight}kg`],
                      ['Âge', `${h.age}a`]
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: C.bgDeep, borderRadius: 8, padding: '5px 6px', textAlign: 'center' }}>
                        <div style={{ color: C.orange, fontWeight: 700, fontSize: 11, fontFamily: C.fontMono }}>{v}</div>
                        <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Modules */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                    {[
                      { label: 'Terrain', ok: h.going_preference === selectedRace.going || h.going_preference === 'any' },
                      { label: 'Distance', ok: h.distance_preference === 'yes' },
                      { label: 'Jockey', ok: h.jockey_win_rate > 0.15 },
                      { label: 'Trainer', ok: h.trainer_form > 0.2 },
                      { label: 'Cote ↘', ok: h.odds_movement < -0.2 },
                      { label: 'Forme', ok: h.form?.startsWith('1') || h.form?.startsWith('2') },
                    ].map(m => (
                      <div key={m.label} style={{ background: m.ok ? '#00FFB210' : '#FF4D6D08', border: `1px solid ${m.ok ? '#00FFB230' : '#FF4D6D20'}`, borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10 }}>{m.ok ? '✅' : '❌'}</div>
                        <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 1 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <KairosHorseBadge index={idx} size="large" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderQuinte = () => {
    if (!quinteCombo) return (
      <div style={{ paddingTop: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 8 }}>QUINTÉ+ KAIROS</div>
        <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 24 }}>Analyse IA de la course Quinté+ du jour</div>
        <button style={S.btnGold} onClick={generateQuinte} disabled={quinteLoading}>
          {quinteLoading ? '⏳ ANALYSE...' : '🏆 GÉNÉRER LES COMBINAISONS'}
        </button>
      </div>
    );
    return (
      <div style={{ paddingTop: 16 }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>🏆 QUINTÉ+ DU JOUR</div>
        <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono, marginBottom: 16 }}>{quinteCombo.track} · {quinteCombo.time} · {quinteCombo.race}</div>

        {/* Analyse IA */}
        <div style={{ ...S.cardGold, marginBottom: 12 }}>
          <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>💡 ANALYSE KAIROS IA</div>
          <div style={{ color: C.textSecondary, fontSize: 12, lineHeight: 1.7 }}>{quinteCombo.analyse}</div>
        </div>

        {/* 3 combinaisons */}
        {[
          { key: 'sure', label: '🛡️ SÛRE', color: C.green, desc: 'Ordre partiel — 3 chevaux' },
          { key: 'equilibre', label: '⚖️ ÉQUILIBRÉE', color: C.gold, desc: 'Dans le désordre — 4 chevaux' },
          { key: 'audacieux', label: '🎲 AUDACIEUSE', color: C.orange, desc: 'Combiné complet — 5 chevaux' },
        ].map(({ key, label, color, desc }) => {
          const combo = quinteCombo[key];
          return (
            <div key={key} style={{ ...S.card, borderColor: `${color}44`, marginBottom: 10 }}>
              <div style={{ color, fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
              <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 8 }}>{desc}</div>
              {combo.horses.map((h, i) => (
                <div key={i} style={{ color: C.textPrimary, fontSize: 13, padding: '3px 0', borderBottom: i < combo.horses.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  {i + 1}. {h}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color, fontWeight: 700, fontSize: 16, fontFamily: C.fontMono }}>{combo.cost}€</div>
                  <div style={{ color: C.textMuted, fontSize: 9 }}>Mise base</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: C.green, fontWeight: 700, fontSize: 16, fontFamily: C.fontMono }}>+{combo.gain}€</div>
                  <div style={{ color: C.textMuted, fontSize: 9 }}>Gain estimé</div>
                </div>
              </div>
              <button style={{ ...S.btnSmall, width: '100%', marginTop: 8, textAlign: 'center', padding: '8px', color, borderColor: `${color}44` }}
                onClick={() => window.open('https://www.pmu.fr', '_blank')}>
                Jouer sur PMU.fr →
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderJockeys = () => {
    const jockeys = [
      { name: 'C. Soumillon', wins: 89, races: 312, pct: 28.5, form: '↑', best: 'Bon' },
      { name: 'L. Dettori', wins: 71, races: 268, pct: 26.5, form: '↑', best: 'Bon à Souple' },
      { name: 'R. Moore', wins: 84, races: 324, pct: 25.9, form: '→', best: 'Good' },
      { name: 'M. Guyon', wins: 63, races: 258, pct: 24.4, form: '↑', best: 'Bon' },
      { name: 'O. Peslier', wins: 54, races: 230, pct: 23.5, form: '↓', best: 'Souple' },
      { name: 'C. Demuro', wins: 61, races: 264, pct: 23.1, form: '→', best: 'Bon' },
      { name: 'S. Pasquier', wins: 48, races: 218, pct: 22.0, form: '↑', best: 'Bon à Souple' },
      { name: 'A. Lemaire', wins: 41, races: 198, pct: 20.7, form: '↓', best: 'Lourd' },
    ];
    return (
      <div style={{ paddingTop: 16 }}>
        <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 4 }}>INDICE JOCKEY</div>
        <div style={{ color: C.textMuted, fontSize: 10, fontFamily: C.fontMono, marginBottom: 16 }}>Top jockeys saison 2026 · Signal fort si top jockey sur outsider</div>
        {jockeys.map((j, i) => (
          <div key={j.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ color: i < 3 ? C.gold : C.textMuted, fontWeight: 900, fontSize: 16, fontFamily: C.fontMono, width: 24 }}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 14 }}>{j.name}</div>
              <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{j.wins}V / {j.races}C · Terrain: {j.best}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: C.orange, fontWeight: 900, fontSize: 18, fontFamily: C.fontMono }}>{j.pct}%</div>
              <div style={{ fontSize: 14, color: j.form === '↑' ? C.green : j.form === '↓' ? C.red : C.gold }}>{j.form}</div>
            </div>
          </div>
        ))}
        <div style={{ ...S.cardGold, marginTop: 8 }}>
          <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>💡 SIGNAL FORT</div>
          <div style={{ color: C.textSecondary, fontSize: 12, lineHeight: 1.6 }}>Si un jockey du Top 5 monte un cheval coté à plus de 6.0, c'est souvent une opportunité cachée. KAIROS le détecte automatiquement.</div>
        </div>
      </div>
    );
  };

  const renderCoach = () => (
    <div style={{ paddingTop: 16 }}>
      <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>COACH HIPPIQUE</div>
      <div style={{ ...S.cardGreen, marginBottom: 12 }}>
        <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>✅ RÈGLES D'OR</div>
        {['Ne jamais dépasser 5% de la bankroll par course', 'Toujours vérifier le terrain avant de miser', 'Jockey top + outsider = opportunité', 'Fuir les favoris sous 1.5 — pas de value', 'Maximum 3 courses par jour'].map(r => (
          <div key={r} style={{ color: C.textSecondary, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>✓ {r}</div>
        ))}
      </div>
      <div style={{ ...S.cardRed, marginBottom: 12 }}>
        <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>🚨 PIÈGES À ÉVITER</div>
        {['Miser après 3 pertes consécutives', 'Suivre les "tuyaux" sans vérification', 'Miser sur terrain défavorable au cheval', 'Ignorer la variation des cotes', 'Parier sur toutes les courses du jour'].map(r => (
          <div key={r} style={{ color: C.textSecondary, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>✗ {r}</div>
        ))}
      </div>
      <div style={{ ...S.cardGold }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>💰 GESTION KELLY</div>
        <div style={{ color: C.textSecondary, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>La mise Kelly optimale est calculée pour chaque course selon la valeur réelle de la cote vs la probabilité KAIROS.</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: C.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>Bankroll €</div>
          <input value={budget} onChange={e => setBudget(e.target.value)} style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 14, flex: 1, outline: 'none' }} />
        </div>
        <div style={{ ...S.cardGreen, margin: 0 }}>
          <div style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>Mise Kelly recommandée</div>
          <div style={{ color: C.textPrimary, fontSize: 22, fontWeight: 900, fontFamily: C.fontMono, marginTop: 4 }}>{(parseFloat(budget || 0) * 0.04).toFixed(2)}€</div>
          <div style={{ color: C.textMuted, fontSize: 9, marginTop: 4 }}>= 4% de la bankroll (règle Kelly conservatrice)</div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'scanner', icon: '🐎', label: 'Courses' },
    { id: 'quinté', icon: '🏆', label: 'Quinté+' },
    { id: 'detail', icon: '🔍', label: 'Analyse' },
    { id: 'jockeys', icon: '👑', label: 'Jockeys' },
    { id: 'coach', icon: '📊', label: 'Coach' },
  ];

  const renderContent = () => {
    switch (tab) {
      case 'scanner': return renderScanner();
      case 'quinté': return renderQuinte();
      case 'detail': return renderDetail();
      case 'jockeys': return renderJockeys();
      case 'coach': return renderCoach();
      default: return renderScanner();
    }
  };

  return (
    <>
      <Head>
        <title>KAIROS HORSES — Intelligence Hippique</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        :root {
          --bg-deep: ${C.bgDeep};
          --bg-base: ${C.bgBase};
          --bg-card: ${C.bgCard};
          --border: ${C.border};
          --text-primary: ${C.textPrimary};
          --text-secondary: ${C.textSecondary};
          --text-muted: ${C.textMuted};
          --green: ${C.green};
          --gold: ${C.gold};
          --orange: ${C.orange};
          --red: ${C.red};
          --font-mono: ${C.fontMono};
        }
      `}</style>
      <div style={S.app}>
        <div style={S.shell}>
          {/* Header */}
          <div style={S.header}>
            <div>
              <div style={{ color: C.orange, fontWeight: 700, fontSize: 18, letterSpacing: 3, fontFamily: C.fontMono }}>🐎 KAIROS HORSES</div>
              <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 3, fontFamily: C.fontMono, textTransform: 'uppercase' }}>Intelligence Hippique · PMU · UK Racing</div>
            </div>
            <a href="/" style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', color: C.textMuted, fontFamily: C.fontMono, fontSize: 9, textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>← KAIROS</a>
          </div>

          {/* Content */}
          <div style={S.scroll}>{renderContent()}</div>

          {/* Footer disclaimer */}
          <div style={{ background: C.bgDeep, padding: '5px 16px 6px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 1, fontFamily: C.fontMono }}>Aucun pari n'est garanti · Jouez responsable · 18+</div>
          </div>

          {/* Nav */}
          <div style={{ background: C.bgDeep, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100 }}>
            {tabs.map(t => (
              <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                <div>{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
