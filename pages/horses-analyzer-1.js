import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const C = {
  bg: '#07090f', bgBase: '#0b0e18', bgCard: '#0f1422', bgDeep: '#070a12',
  border: '#1a2035', green: '#00FFB2', gold: '#FFD700', orange: '#FF6B00',
  red: '#FF4D6D', textPrimary: '#e8eaf0', textSecondary: '#8892a4',
  textMuted: '#4a5568', fontMono: "'Courier New', monospace",
};

const S = {
  app: { background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: C.fontMono },
  shell: { width: '100%', maxWidth: 430, background: C.bgBase, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, background: C.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 14px 80px' },
  card: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGold: { background: '#1a150020', border: '1px solid #FFD70044', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardGreen: { background: '#00FFB210', border: '1px solid #00FFB244', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  cardRed: { background: '#FF4D6D10', border: '1px solid #FF4D6D44', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: C.orange, color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGold: { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
  btnGhost: { background: 'transparent', color: C.orange, border: `1px solid #FF6B0044`, borderRadius: 12, padding: '10px 16px', fontFamily: C.fontMono, fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase' },
  btnPlay: { background: 'linear-gradient(135deg, #FFD700, #FF6B00)', color: '#07090f', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: C.fontMono, fontWeight: 900, fontSize: 14, letterSpacing: 2, cursor: 'pointer', width: '100%', textTransform: 'uppercase' },
};

// ── ALGO KAIROS ──────────────────────────────────────────────────
function analyzeMusique(musique) {
  if (!musique) return { nb: 0, v: 0, p: 0, reg: 0, tendance: 'inconnu', serie: 0 };
  const chars = musique.replace(/[^1-9p]/g, '').split('');
  let nb = 0, v = 0, p = 0;
  for (const ch of chars) {
    if (/[1-9]/.test(ch)) { nb++; if (ch === '1') v++; if (['2','3'].includes(ch)) p++; }
    if (ch === 'p') p++;
  }
  const reg = nb > 0 ? Math.round((v + p) / nb * 100) : 0;
  const recent = chars.filter(c => /[1-9]/.test(c)).slice(-3);
  const avg = recent.reduce((a, c) => a + parseInt(c), 0) / Math.max(recent.length, 1);
  const tendance = avg <= 2 ? 'excellent' : avg <= 4 ? 'bon' : 'moyen';
  let serie = 0;
  const all = chars.filter(c => /[1-9]/.test(c));
  for (let i = all.length - 1; i >= 0; i--) { if (['1','2','3'].includes(all[i])) serie++; else break; }
  return { nb, v, p, reg, tendance, serie };
}

function getJockeyScore(j) {
  if (!j) return 10;
  const u = j.toUpperCase();
  if (u.includes('DEMURO') || u.includes('SOUMILLON')) return 100;
  if (u.includes('GUYON') || u.includes('POUCHIN')) return 90;
  if (u.includes('BARZALONA') || u.includes('LEMAIRE')) return 85;
  if (u.includes('PESLIER') || u.includes('PASQUIER')) return 80;
  if (u.includes('DETTORI') || u.includes('MOORE')) return 95;
  if (u.includes('GRANDIN') || u.includes('BACHELOT')) return 60;
  return 40;
}

function getTrainerScore(t) {
  if (!t) return 10;
  const u = t.toUpperCase();
  if (u.includes('FABRE') || u.includes('ROUGET')) return 100;
  if (u.includes('LELLOUCHE') || u.includes('CHAPPET') || u.includes('GRAFFARD')) return 90;
  if (u.includes('PANTALL') || u.includes('BRANDT') || u.includes('HERMANS')) return 85;
  return 50;
}

function computeKairos(horse, going) {
  const m = analyzeMusique(horse.musique);
  const score = {};

  // Forme (200)
  let f = 0;
  if (horse.musique) {
    const chars = horse.musique.replace(/[^1-9p]/g, '').split('');
    const recent = chars.filter(c => /[1-9p]/.test(c)).slice(-5);
    const weights = [1, 1, 1, 2, 3];
    recent.forEach((ch, i) => {
      const w = weights[i] || 1;
      if (ch === '1') f += 30 * w; else if (ch === '2') f += 18 * w;
      else if (ch === '3') f += 10 * w; else if (ch === 'p') f += 7 * w;
    });
    if (m.serie >= 3) f += 50; else if (m.serie >= 2) f += 25;
  }
  score.forme = Math.min(Math.round(f), 200);

  // Régularité (150)
  score.regularite = Math.min(Math.round(m.reg * 1.5), 150);

  // Victoires (100)
  score.victoires = Math.min(Math.round((m.nb > 0 ? m.v / m.nb : 0) * 200), 100);

  // Places (100)
  score.places = Math.min(Math.round((m.nb > 0 ? m.p / m.nb : 0) * 150), 100);

  // Jockey (100)
  score.jockey = getJockeyScore(horse.jockey);

  // Entraîneur (100)
  score.entraineur = getTrainerScore(horse.trainer);

  // Distance (75)
  score.distance = m.tendance === 'excellent' ? 75 : m.tendance === 'bon' ? 50 : 25;

  // Terrain (75)
  score.terrain = 50;

  // VH (50)
  score.vh = horse.vh > 40 ? 50 : horse.vh > 20 ? 35 : horse.vh > 0 ? 20 : 15;

  // Value (50)
  const ip = 1 / Math.max(horse.odds, 1.01);
  const kp = Math.min(Object.values(score).reduce((a, b) => a + b, 0) / 1000, 0.95);
  score.value = (kp - ip) > 0.2 ? 50 : (kp - ip) > 0.1 ? 35 : 20;

  // Pénalités
  let pen = 0;
  const topTrainer = getTrainerScore(horse.trainer) >= 90;
  if (horse.odds < 1.5) pen -= topTrainer ? 50 : 100;
  if (horse.vh === 0 && topTrainer) pen += 10;

  const total = Math.min(Math.max(Object.values(score).reduce((a, b) => a + b, 0) + pen, 100), 1000);
  return { ...score, total, musique: m };
}

function getLabel(idx) {
  if (idx >= 950) return { text: 'EXCEPTIONNEL', color: C.green };
  if (idx >= 900) return { text: 'TRÈS FORT', color: C.green };
  if (idx >= 850) return { text: 'BONNE OPPORTUNITÉ', color: C.green };
  if (idx >= 800) return { text: 'JOUABLE', color: C.gold };
  if (idx >= 700) return { text: 'RISQUÉ', color: C.orange };
  return { text: 'ÉVITER', color: C.red };
}

function getVerdict(horse) {
  const idx = horse.kairosIndex;
  const topTrainer = getTrainerScore(horse.trainer) >= 90;
  if (horse.odds < 1.5 && !topTrainer) return '🔴 PIÈGE — sur-favori sans valeur.';
  if (horse.odds < 1.5 && topTrainer) return '⚠️ FAVORI — entraîneur top. Placé sécurisé.';
  if (idx >= 900) return '🟢 EXCEPTIONNEL — jouer sans hésiter.';
  if (idx >= 850) return '🟢 TRÈS FORT — Simple Gagnant recommandé.';
  if (idx >= 800) return '🟡 JOUABLE — bon dans un combiné.';
  if (idx >= 700) return '🟠 RISQUÉ — uniquement en Quinté/Super4.';
  return '⚪ OBSERVATION.';
}

// ── PARSER TEXTE LIBRE ───────────────────────────────────────────
function parseHorseText(raw) {
  // Rejoindre les lignes qui commencent par VH ou une musique avec la ligne précédente
  const joined = raw.replace(/\n(VH[\s.]*\d)/gi, ' $1')
                    .replace(/\n([1-9][p]?[1-9])/g, ' $1');
  
  const lines = joined.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const horses = [];

  for (const line of lines) {
    try {
      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;

      let num = parseInt(parts[0]);
      if (isNaN(num) || num < 1 || num > 30) continue;

      // Extraire cote
      let odds = 3.0;
      const coteMatch = line.match(/\b(\d{1,2}[.,]\d{1,2})\b/);
      if (coteMatch) odds = parseFloat(coteMatch[1].replace(',', '.'));

      // Extraire VH
      let vh = 0;
      const vhMatch = line.match(/VH[\s.,]*(\d+[.,]?\d*)/i);
      if (vhMatch) vh = parseFloat(vhMatch[1].replace(',', '.'));

      // Extraire musique
      let musique = '';
      const musiqueMatches = [...line.matchAll(/\b([1-9][p]?(?:[1-9][p]?){2,})\b/g)];
      if (musiqueMatches.length > 0) musique = musiqueMatches[musiqueMatches.length - 1][1];

      // Extraire jockeys/entraîneurs
      const nameMatches = [...line.matchAll(/\b([A-Z]{1,3}\.[A-Z][A-Za-zÀ-ÿ]{2,15})\b/g)];
      const jockey = nameMatches[0]?.[1] || '';
      const trainer = nameMatches[1]?.[1] || '';

      // Extraire nom du cheval
      let nom = `Cheval ${num}`;
      const afterNum = line.replace(/^\d+\s+/, '');
      const nomMatch = afterNum.match(/^([A-ZÉÈÀÙÂÊÎÔÛÄËÏÖÜ][A-ZÉÈÀÙÂÊÎÔÛÄËÏÖÜ\s\-']{1,30}?)(?:\s+[A-Z]{1,3}\.|$)/);
      if (nomMatch) nom = nomMatch[1].trim();

      if (odds > 0) horses.push({ num, nom, jockey, trainer, odds, vh, musique });
    } catch {}
  }

  return horses;
}

// ── GÉNÉRER TOUS LES TICKETS ─────────────────────────────────────
function generateAllTickets(horses, budget) {
  const n = horses.length;
  if (n === 0) return [];
  const sorted = [...horses].sort((a, b) => b.kairosIndex - a.kairosIndex);
  const best = sorted[0];
  const kelly = best.kairosIndex >= 900 ? 0.08 : best.kairosIndex >= 800 ? 0.06 : best.kairosIndex >= 700 ? 0.04 : 0.02;
  const r = v => parseFloat((v || 0).toFixed(2));
  const ph = h => ({ num: h.num, name: h.nom, jockey: h.jockey, odds: h.odds, kairosIndex: h.kairosIndex, vh: h.vh });

  const tickets = [];

  // Simple Gagnant
  tickets.push({ type: 'Simple Gagnant', emoji: '🎯', horses: [ph(sorted[0])], mise: r(budget * kelly), gain: r(budget * kelly * sorted[0].odds * 0.9), recommended: best.kairosIndex >= 850, conseil: getVerdict(sorted[0]) });

  // Simple Placé
  tickets.push({ type: 'Simple Placé', emoji: '🥉', horses: [ph(sorted[0])], mise: r(budget * kelly * 0.5), gain: r(budget * kelly * 0.5 * Math.min(sorted[0].odds * 0.33, 3) * 0.9), recommended: best.kairosIndex >= 700, conseil: 'Finir dans les 3 premiers suffit.' });

  // Couplé Gagnant Ordre
  if (n >= 2) tickets.push({ type: 'Couplé Gagnant Ordre', emoji: '🔢', horses: sorted.slice(0, 2).map(ph), mise: r(budget * kelly * 0.6), gain: r(budget * kelly * 0.6 * sorted[0].odds * sorted[1].odds * 0.2 * 0.9), recommended: sorted[1].kairosIndex >= 750, conseil: `${sorted[0].nom} 1er, ${sorted[1].nom} 2ème — ordre exact.` });

  // Couplé Désordre
  if (n >= 2) tickets.push({ type: 'Couplé Désordre', emoji: '🔀', horses: sorted.slice(0, 2).map(ph), mise: r(budget * kelly * 0.5), gain: r(budget * kelly * 0.5 * sorted[0].odds * sorted[1].odds * 0.12 * 0.9), recommended: sorted[1].kairosIndex >= 650, conseil: `${sorted[0].nom} + ${sorted[1].nom} — ordre libre.` });

  // Trio
  if (n >= 3) tickets.push({ type: 'Trio', emoji: '🏅', horses: sorted.slice(0, 3).map(ph), mise: r(budget * kelly * 0.35), gain: r(budget * kelly * 0.35 * sorted[0].odds * 3 * 0.9), recommended: sorted[2].kairosIndex >= 650, conseil: 'Top 3 dans les 3 premiers — ordre libre.' });

  // Tiercé Ordre
  if (n >= 3) tickets.push({ type: 'Tiercé Ordre', emoji: '🏆', horses: sorted.slice(0, 3).map(ph), mise: r(budget * kelly * 0.4), gain: r(budget * kelly * 0.4 * sorted[0].odds * 5 * 0.9), recommended: sorted[0].kairosIndex >= 850, conseil: `${sorted[0].nom}, ${sorted[1].nom}, ${sorted[2].nom} — ordre exact.` });

  // Tiercé Désordre
  if (n >= 3) tickets.push({ type: 'Tiercé Désordre', emoji: '🎲', horses: sorted.slice(0, 3).map(ph), mise: r(budget * kelly * 0.35), gain: r(budget * kelly * 0.35 * sorted[0].odds * 3 * 0.9), recommended: sorted[2].kairosIndex >= 700, conseil: 'Top 3 — ordre libre.' });

  // Quarté+
  if (n >= 4) tickets.push({ type: 'Quarté+', emoji: '4️⃣', horses: sorted.slice(0, 4).map(ph), mise: r(budget * kelly * 0.3), gain: r(budget * kelly * 0.3 * sorted[0].odds * 8 * 0.9), recommended: sorted[3].kairosIndex >= 600, conseil: 'Top 4 dans les 4 premiers — ordre libre.' });

  // Super4
  if (n >= 4) {
    const allStrong = sorted.slice(0, 4).every(h => h.kairosIndex >= 850);
    tickets.push({ type: 'Super4', emoji: '⭐', horses: sorted.slice(0, 4).map(ph), mise: r(budget * kelly * 0.3), gain: r(budget * kelly * 0.3 * sorted[0].odds * 15 * 0.9), recommended: allStrong, conseil: allStrong ? '4 chevaux solides — recommandé !' : '⚠️ Préférer Quinté+ Désordre.' });
  }

  // Quinté+ Désordre
  if (n >= 5) tickets.push({ type: 'Quinté+ Désordre', emoji: '🌟', horses: sorted.slice(0, 5).map(ph), mise: r(budget * kelly * 0.2), gain: r(budget * kelly * 0.2 * sorted[0].odds * 20 * 0.9), recommended: true, conseil: 'Top 5 — ordre libre. Jackpot possible !' });

  // Quinté+ Ordre
  if (n >= 5) tickets.push({ type: 'Quinté+ Ordre', emoji: '💎', horses: sorted.slice(0, 5).map(ph), mise: r(budget * kelly * 0.15), gain: r(budget * kelly * 0.15 * sorted[0].odds * 50 * 0.9), recommended: false, conseil: 'Top 5 dans l\'ordre exact — jackpot maximum.' });

  return tickets;
}

function AnalyzerPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseLink, setCourseLink] = useState('');
  const [budget, setBudget] = useState('100');
  const [horses, setHorses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [misePerso, setMisePerso] = useState('');

  const analyze = () => {
    setError('');
    const parsed = parseHorseText(rawText);
    if (parsed.length < 2) {
      setError('Minimum 2 chevaux requis. Vérifie le format.');
      return;
    }
    const going = 'Bon';
    const enriched = parsed.map(h => {
      const ks = computeKairos(h, going);
      return { ...h, kairosIndex: ks.total, kairosScore: ks, verdict: getVerdict({ ...h, kairosIndex: ks.total }) };
    }).sort((a, b) => b.kairosIndex - a.kairosIndex);
    setHorses(enriched);
    setTickets(generateAllTickets(enriched, parseFloat(budget) || 100));
    setAnalyzed(true);
  };

  const reset = () => { setRawText(''); setHorses([]); setTickets([]); setAnalyzed(false); setError(''); setCourseName(''); setCourseLink(''); };

  const EXAMPLE = `1 TORTISAMBERT M.BARZALONA FH.GRAFFARD 4.8 VH.43,5 2p5p1p2p8p3p
2 ALEM C.DEMURO HA.PANTALL 10.8 VH.43 4p5p3p5p3p2p1p
3 AFOGADO C.LECOEUVRE PJ.BRANDT 8.0 VH.43 4p7p0p4p8p3p2p1p
4 FIRE REBEL F.LEFEBVRE A.SPANU 42.4 VH.42,5 8p6p7p6p1p1p5p1p
5 SINILEO M.GUYON A.FABRE 4.5 VH.49,5 1p3p8p1p
6 CASAPUEBLO A.POUCHIN A.FABRE 3.6 VH.50,5 1p1p4p7p2p2p5p6p`;

  return (
    <>
      <Head>
        <title>KAIROS ANALYZER — Analyse Hippique</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${C.bg}; }`}</style>
      <div style={S.app}>
        <div style={S.shell}>
          {/* Header */}
          <div style={S.header}>
            <div>
              <div style={{ color: C.orange, fontWeight: 700, fontSize: 17, letterSpacing: 3, fontFamily: C.fontMono }}>🔬 KAIROS ANALYZER</div>
              <div style={{ color: C.textMuted, fontSize: 8, letterSpacing: 2, fontFamily: C.fontMono }}>ANALYSE HIPPIQUE · TOUS LES PARIS</div>
            </div>
            <a href="/horses" style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', color: C.textMuted, fontFamily: C.fontMono, fontSize: 9, textDecoration: 'none', textTransform: 'uppercase' }}>← HORSES</a>
          </div>

          <div style={S.scroll}>
            {!analyzed ? (
              <div style={{ paddingTop: 16 }}>
                {/* Infos course */}
                <div style={{ ...S.card, marginBottom: 10 }}>
                  <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>INFOS COURSE (optionnel)</div>
                  <input value={courseName} onChange={e => setCourseName(e.target.value)}
                    placeholder="Ex: Prix Ridgway · Longchamp · 14:03"
                    style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 12, width: '100%', outline: 'none', marginBottom: 8 }} />
                  <input value={courseLink} onChange={e => setCourseLink(e.target.value)}
                    placeholder="Lien EuroTiercé (ex: eurotierce.be/fr/course/R1/C3)"
                    style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 11, width: '100%', outline: 'none' }} />
                </div>

                {/* Zone de saisie */}
                <div style={{ ...S.card, marginBottom: 10 }}>
                  <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>COLLE LES CHEVAUX ICI</div>
                  <div style={{ color: C.textMuted, fontSize: 9, marginBottom: 8, lineHeight: 1.5 }}>
                    Format : NUM NOM JOCKEY ENTRAÎNEUR COTE VH.XX MUSIQUE
                  </div>
                  <textarea value={rawText} onChange={e => setRawText(e.target.value)}
                    placeholder={EXAMPLE}
                    rows={10}
                    style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 11, width: '100%', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
                  <button style={{ ...S.btnGhost, fontSize: 9, padding: '6px 12px', marginTop: 8 }}
                    onClick={() => setRawText(EXAMPLE)}>
                    📋 Charger exemple
                  </button>
                </div>

                {/* Bankroll */}
                <div style={{ ...S.card, marginBottom: 12 }}>
                  <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>BANKROLL</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={budget} onChange={e => setBudget(e.target.value)} type="number"
                      style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.textPrimary, fontFamily: C.fontMono, fontSize: 16, flex: 1, outline: 'none' }} />
                    <span style={{ color: C.textMuted, fontFamily: C.fontMono }}>€</span>
                  </div>
                </div>

                {error && <div style={{ ...S.cardRed, marginBottom: 10 }}><div style={{ color: C.red, fontSize: 12 }}>❌ {error}</div></div>}

                <button style={S.btnGold} onClick={analyze}>⚡ ANALYSER AVEC KAIROS</button>
              </div>
            ) : (
              <div style={{ paddingTop: 16 }}>
                {/* Header résultats */}
                {courseName && (
                  <div style={{ ...S.cardGold, marginBottom: 10 }}>
                    <div style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>🏇 {courseName}</div>
                    {courseLink && (
                      <button style={{ ...S.btnGhost, fontSize: 9, padding: '5px 12px', marginTop: 8, color: C.gold, borderColor: '#FFD70044' }}
                        onClick={() => window.open(courseLink.startsWith('http') ? courseLink : `https://${courseLink}`, '_blank')}>
                        🔗 Ouvrir EuroTiercé →
                      </button>
                    )}
                  </div>
                )}

                {/* Évaluation complète */}
                <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8, fontFamily: C.fontMono }}>
                  ÉVALUATION KAIROS — {horses.length} PARTANTS
                </div>
                {horses.map((h, i) => {
                  const label = getLabel(h.kairosIndex);
                  const probV = Math.min(Math.round(h.kairosIndex / 12), 85);
                  const probT3 = Math.min(Math.round(h.kairosIndex / 8), 95);
                  return (
                    <div key={i} style={{ ...S.card, borderColor: i === 0 ? '#FF6B0044' : h.odds < 1.5 ? '#FF4D6D33' : C.border, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ color: i === 0 ? C.gold : C.textMuted, fontWeight: 900, fontFamily: C.fontMono, fontSize: 14 }}>{h.num}</span>
                            <span style={{ color: h.odds < 1.5 ? C.red : C.textPrimary, fontWeight: 700, fontSize: 14 }}>{h.nom}</span>
                            {i === 0 && <span style={{ background: '#FFD70020', color: C.gold, border: '1px solid #FFD70044', padding: '1px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700 }}>🏆 #1</span>}
                            {h.odds < 1.5 && <span style={{ background: '#FF4D6D20', color: C.red, border: '1px solid #FF4D6D44', padding: '1px 7px', borderRadius: 10, fontSize: 8 }}>⚠️ PIÈGE</span>}
                            {h.odds > 8 && h.kairosIndex >= 750 && <span style={{ background: '#00FFB210', color: C.green, border: '1px solid #00FFB244', padding: '1px 7px', borderRadius: 10, fontSize: 8 }}>💎 VALUE</span>}
                          </div>
                          <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono }}>{h.jockey} · {h.trainer} · VH {h.vh}</div>
                          <div style={{ color: C.textMuted, fontSize: 9, fontFamily: C.fontMono, marginTop: 2 }}>Musique : {h.musique || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 10 }}>
                          <div style={{ color: label.color, fontWeight: 900, fontSize: 22, fontFamily: C.fontMono }}>{h.kairosIndex}</div>
                          <div style={{ color: C.textMuted, fontSize: 7 }}>/1000</div>
                          <div style={{ color: C.orange, fontWeight: 700, fontSize: 14, fontFamily: C.fontMono, marginTop: 2 }}>@{h.odds}</div>
                        </div>
                      </div>

                      {/* Probabilités */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 6 }}>
                        {[['Victoire', `${probV}%`, C.green], ['Top 3', `${probT3}%`, C.gold], ['Indice', label.text, label.color]].map(([l, v, col]) => (
                          <div key={l} style={{ background: C.bgDeep, borderRadius: 7, padding: '5px 4px', textAlign: 'center' }}>
                            <div style={{ color: col, fontWeight: 700, fontSize: 10, fontFamily: C.fontMono }}>{v}</div>
                            <div style={{ color: C.textMuted, fontSize: 7 }}>{l}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ color: C.textSecondary, fontSize: 10, fontStyle: 'italic' }}>{h.verdict}</div>
                    </div>
                  );
                })}

                {/* Tous les tickets */}
                <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8, marginTop: 14, fontFamily: C.fontMono }}>
                  TOUS LES PARIS DISPONIBLES
                </div>
                {tickets.map((t, i) => (
                  <div key={i} style={{ ...S.card, borderColor: t.recommended ? '#00FFB244' : C.border, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 16 }}>{t.emoji}</span>
                          <span style={{ color: t.recommended ? C.green : C.textPrimary, fontWeight: 700, fontSize: 14 }}>{t.type}</span>
                          {t.recommended && <span style={{ background: '#00FFB220', color: C.green, border: '1px solid #00FFB244', padding: '1px 8px', borderRadius: 10, fontSize: 8, fontWeight: 700 }}>RECOMMANDÉ</span>}
                        </div>
                        <div style={{ color: C.textMuted, fontSize: 10 }}>{t.conseil}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: C.orange, fontWeight: 900, fontSize: 15, fontFamily: C.fontMono }}>{t.mise}€</div>
                        <div style={{ color: C.green, fontWeight: 700, fontSize: 13, fontFamily: C.fontMono }}>+{t.gain}€</div>
                      </div>
                    </div>
                    {t.horses.map((h, hi) => (
                      <div key={hi} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: `1px solid ${C.border}` }}>
                        <span style={{ color: C.textPrimary, fontSize: 12 }}>{hi + 1}. {h.num}. {h.name}</span>
                        <span style={{ color: C.orange, fontSize: 12, fontFamily: C.fontMono }}>@{h.odds}</span>
                      </div>
                    ))}
                    <button style={{ background: '#00FFB210', color: C.green, border: '1px solid #00FFB244', borderRadius: 8, padding: '7px', fontFamily: C.fontMono, fontSize: 9, cursor: 'pointer', width: '100%', marginTop: 6, textTransform: 'uppercase' }}
                      onClick={() => { const nums = t.horses.map(h => h.num).join(' · '); navigator.clipboard?.writeText(nums).catch(()=>{}); alert(`Numéros copiés : ${nums}`); }}>
                      📋 COPIER : {t.horses.map(h => h.num).join(' · ')}
                    </button>
                    {(courseLink || t.recommended) && (
                      <button style={{ ...S.btnPlay, marginTop: 6, padding: '10px', fontSize: 11 }}
                        onClick={() => setShowConfirm(t)}>
                        🎯 JOUER SUR EUROTIERCÉ →
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={{ ...S.btnGhost, flex: 1 }} onClick={reset}>🔄 Nouvelle course</button>
                  {courseLink && (
                    <button style={{ ...S.btnGhost, flex: 1, color: C.gold, borderColor: '#FFD70044' }}
                      onClick={() => window.open(courseLink.startsWith('http') ? courseLink : `https://${courseLink}`, '_blank')}>
                      🔗 EuroTiercé
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation */}
          {showConfirm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000000cc', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: C.bgCard, border: `2px solid ${C.orange}`, borderRadius: 18, padding: 24, width: '100%', maxWidth: 380 }}>
                <div style={{ color: C.orange, fontWeight: 900, fontSize: 18, letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>⚡ CONFIRMER</div>
                <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{showConfirm.emoji} {showConfirm.type}</div>
                {showConfirm.horses.map((h, i) => (
                  <div key={i} style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', padding: '2px 0' }}>{h.num}. {h.name} @{h.odds}</div>
                ))}
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <div style={{ color: C.textMuted, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>CHOISIR LA MISE</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[2, 5, 10, 20, 50, showConfirm.mise].filter((v, i, a) => a.indexOf(v) === i).map(m => (
                      <button key={m} style={{ background: (parseFloat(misePerso) || showConfirm.mise) == m ? C.orange : C.bgDeep, color: (parseFloat(misePerso) || showConfirm.mise) == m ? '#07090f' : C.textPrimary, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontFamily: C.fontMono, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => setMisePerso(String(m))}>
                        {m}€
                      </button>
                    ))}
                  </div>
                  <div style={{ color: C.green, fontSize: 14, marginTop: 10, fontFamily: C.fontMono, fontWeight: 700, textAlign: 'center' }}>
                    Gain estimé : +{((parseFloat(misePerso || showConfirm.mise) * showConfirm.horses[0]?.odds) * 0.9).toFixed(2)}€
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...S.btnGhost, flex: 1 }} onClick={() => { setShowConfirm(null); setMisePerso(''); }}>Annuler</button>
                  <button style={{ ...S.btnPlay, flex: 2, padding: '14px', fontSize: 13 }}
                    onClick={() => {
                      setShowConfirm(null); setMisePerso('');
                      const link = courseLink ? (courseLink.startsWith('http') ? courseLink : `https://${courseLink}`) : 'https://www.eurotierce.be';
                      window.open(link, '_blank');
                    }}>🎯 JOUER</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: C.bgDeep, padding: '5px 16px 6px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ color: C.textMuted, fontSize: 8, fontFamily: C.fontMono }}>Aucun pari n'est garanti · Jouez responsable · 18+</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(AnalyzerPage), { ssr: false });
