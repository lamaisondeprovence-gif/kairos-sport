import { useState, useEffect } from 'react';
import Head from 'next/head';

const LEAGUES = {
  serie_a: {
    name: 'Serie A', flag: '🇮🇹', icon: '⚽',
    teams: [
      { name: 'Inter Milan', strength: 92, form: 90, odds: 2.1, homeStr: 94, awayStr: 86, attack: 88, defense: 92, position: 1 },
      { name: 'Napoli', strength: 88, form: 85, odds: 3.8, homeStr: 88, awayStr: 82, attack: 85, defense: 86, position: 2 },
      { name: 'Atalanta', strength: 86, form: 88, odds: 4.2, homeStr: 86, awayStr: 82, attack: 90, defense: 80, position: 3 },
      { name: 'Juventus', strength: 84, form: 80, odds: 5.5, homeStr: 86, awayStr: 78, attack: 78, defense: 88, position: 4 },
      { name: 'AC Milan', strength: 82, form: 78, odds: 6.5, homeStr: 84, awayStr: 76, attack: 80, defense: 82, position: 5 },
      { name: 'Roma', strength: 78, form: 74, odds: 14.0, homeStr: 80, awayStr: 70, attack: 76, defense: 74, position: 6 },
      { name: 'Lazio', strength: 76, form: 72, odds: 18.0, homeStr: 78, awayStr: 68, attack: 74, defense: 72, position: 7 },
      { name: 'Fiorentina', strength: 74, form: 73, odds: 22.0, homeStr: 76, awayStr: 67, attack: 72, defense: 70, position: 8 },
      { name: 'Bologna', strength: 72, form: 71, odds: 28.0, homeStr: 74, awayStr: 64, attack: 70, defense: 68, position: 9 },
      { name: 'Torino', strength: 67, form: 63, odds: 55.0, homeStr: 68, awayStr: 58, attack: 63, defense: 66, position: 10 },
    ],
    matchdays: [
      { home: 'Inter Milan', away: 'Napoli', date: '2026-06-14T20:45', matchday: 37 },
      { home: 'Atalanta', away: 'Roma', date: '2026-06-14T20:45', matchday: 37 },
      { home: 'Juventus', away: 'AC Milan', date: '2026-06-15T18:00', matchday: 37 },
      { home: 'Lazio', away: 'Fiorentina', date: '2026-06-15T20:45', matchday: 37 },
      { home: 'Bologna', away: 'Torino', date: '2026-06-15T20:45', matchday: 37 },
      { home: 'Napoli', away: 'Juventus', date: '2026-06-21T20:45', matchday: 38 },
      { home: 'AC Milan', away: 'Inter Milan', date: '2026-06-21T20:45', matchday: 38 },
      { home: 'Roma', away: 'Atalanta', date: '2026-06-22T18:00', matchday: 38 },
      { home: 'Torino', away: 'Lazio', date: '2026-06-22T20:45', matchday: 38 },
    ],
  },
  la_liga: {
    name: 'La Liga', flag: '🇪🇸', icon: '⚽',
    teams: [
      { name: 'Real Madrid', strength: 95, form: 92, odds: 1.8, homeStr: 96, awayStr: 92, attack: 94, defense: 90, position: 1 },
      { name: 'Barcelona', strength: 90, form: 88, odds: 3.2, homeStr: 94, awayStr: 86, attack: 92, defense: 84, position: 2 },
      { name: 'Atletico Madrid', strength: 85, form: 82, odds: 5.5, homeStr: 88, awayStr: 80, attack: 78, defense: 92, position: 3 },
      { name: 'Athletic Bilbao', strength: 76, form: 77, odds: 22.0, homeStr: 80, awayStr: 68, attack: 74, defense: 76, position: 4 },
      { name: 'Villarreal', strength: 75, form: 72, odds: 25.0, homeStr: 78, awayStr: 68, attack: 74, defense: 72, position: 5 },
      { name: 'Real Sociedad', strength: 73, form: 70, odds: 32.0, homeStr: 76, awayStr: 66, attack: 71, defense: 70, position: 6 },
      { name: 'Betis', strength: 70, form: 68, odds: 42.0, homeStr: 72, awayStr: 63, attack: 68, defense: 68, position: 7 },
      { name: 'Sevilla', strength: 68, form: 64, odds: 50.0, homeStr: 70, awayStr: 61, attack: 66, defense: 66, position: 8 },
      { name: 'Valencia', strength: 63, form: 60, odds: 75.0, homeStr: 65, awayStr: 56, attack: 61, defense: 61, position: 9 },
      { name: 'Getafe', strength: 58, form: 55, odds: 100.0, homeStr: 62, awayStr: 50, attack: 54, defense: 62, position: 10 },
    ],
    matchdays: [
      { home: 'Real Madrid', away: 'Barcelona', date: '2026-06-14T21:00', matchday: 37 },
      { home: 'Atletico Madrid', away: 'Athletic Bilbao', date: '2026-06-14T19:00', matchday: 37 },
      { home: 'Villarreal', away: 'Real Sociedad', date: '2026-06-15T17:30', matchday: 37 },
      { home: 'Betis', away: 'Sevilla', date: '2026-06-15T21:00', matchday: 37 },
      { home: 'Valencia', away: 'Getafe', date: '2026-06-15T19:00', matchday: 37 },
      { home: 'Barcelona', away: 'Atletico Madrid', date: '2026-06-21T21:00', matchday: 38 },
      { home: 'Athletic Bilbao', away: 'Real Madrid', date: '2026-06-21T19:00', matchday: 38 },
      { home: 'Real Sociedad', away: 'Villarreal', date: '2026-06-22T17:30', matchday: 38 },
      { home: 'Sevilla', away: 'Valencia', date: '2026-06-22T21:00', matchday: 38 },
    ],
  },
  ligue_1: {
    name: 'Ligue 1', flag: '🇫🇷', icon: '⚽',
    teams: [
      { name: 'PSG', strength: 94, form: 90, odds: 1.35, homeStr: 98, awayStr: 90, attack: 95, defense: 88, position: 1 },
      { name: 'Monaco', strength: 82, form: 80, odds: 6.5, homeStr: 86, awayStr: 76, attack: 82, defense: 78, position: 2 },
      { name: 'Lille', strength: 78, form: 76, odds: 11.0, homeStr: 82, awayStr: 72, attack: 76, defense: 78, position: 3 },
      { name: 'Brest', strength: 74, form: 75, odds: 18.0, homeStr: 76, awayStr: 68, attack: 73, defense: 72, position: 4 },
      { name: 'Nice', strength: 72, form: 70, odds: 24.0, homeStr: 76, awayStr: 64, attack: 70, defense: 72, position: 5 },
      { name: 'Lyon', strength: 70, form: 67, odds: 28.0, homeStr: 74, awayStr: 63, attack: 68, defense: 68, position: 6 },
      { name: 'Marseille', strength: 68, form: 65, odds: 35.0, homeStr: 72, awayStr: 61, attack: 66, defense: 66, position: 7 },
      { name: 'Rennes', strength: 65, form: 63, odds: 45.0, homeStr: 68, awayStr: 58, attack: 63, defense: 63, position: 8 },
      { name: 'Lens', strength: 63, form: 61, odds: 55.0, homeStr: 66, awayStr: 56, attack: 61, defense: 61, position: 9 },
      { name: 'Strasbourg', strength: 58, form: 55, odds: 80.0, homeStr: 62, awayStr: 50, attack: 56, defense: 58, position: 10 },
    ],
    matchdays: [
      { home: 'PSG', away: 'Monaco', date: '2026-06-14T21:00', matchday: 34 },
      { home: 'Lille', away: 'Brest', date: '2026-06-14T19:00', matchday: 34 },
      { home: 'Nice', away: 'Lyon', date: '2026-06-15T17:00', matchday: 34 },
      { home: 'Marseille', away: 'Rennes', date: '2026-06-15T21:00', matchday: 34 },
      { home: 'Lens', away: 'Strasbourg', date: '2026-06-15T19:00', matchday: 34 },
      { home: 'Monaco', away: 'Lille', date: '2026-06-21T21:00', matchday: 35 },
      { home: 'Brest', away: 'PSG', date: '2026-06-21T19:00', matchday: 35 },
      { home: 'Lyon', away: 'Marseille', date: '2026-06-22T17:00', matchday: 35 },
      { home: 'Rennes', away: 'Nice', date: '2026-06-22T21:00', matchday: 35 },
    ],
  },
  pro_league: {
    name: 'Pro League', flag: '🇧🇪', icon: '⚽',
    teams: [
      { name: 'Club Brugge', strength: 83, form: 81, odds: 2.4, homeStr: 86, awayStr: 79, attack: 81, defense: 82, position: 1 },
      { name: 'Anderlecht', strength: 79, form: 76, odds: 3.8, homeStr: 82, awayStr: 74, attack: 77, defense: 76, position: 2 },
      { name: 'Genk', strength: 76, form: 74, odds: 6.0, homeStr: 78, awayStr: 71, attack: 75, defense: 73, position: 3 },
      { name: 'Union SG', strength: 74, form: 73, odds: 8.5, homeStr: 76, awayStr: 69, attack: 73, defense: 71, position: 4 },
      { name: 'Antwerp', strength: 70, form: 67, odds: 16.0, homeStr: 72, awayStr: 63, attack: 68, defense: 68, position: 5 },
      { name: 'Gent', strength: 68, form: 66, odds: 20.0, homeStr: 70, awayStr: 62, attack: 66, defense: 66, position: 6 },
      { name: 'Standard', strength: 63, form: 60, odds: 35.0, homeStr: 66, awayStr: 56, attack: 61, defense: 61, position: 7 },
      { name: 'Westerlo', strength: 58, form: 55, odds: 55.0, homeStr: 62, awayStr: 50, attack: 56, defense: 57, position: 8 },
      { name: 'OHL', strength: 55, form: 53, odds: 80.0, homeStr: 58, awayStr: 48, attack: 53, defense: 54, position: 9 },
    ],
    matchdays: [
      { home: 'Club Brugge', away: 'Anderlecht', date: '2026-06-14T18:00', matchday: 8 },
      { home: 'Genk', away: 'Union SG', date: '2026-06-14T20:30', matchday: 8 },
      { home: 'Antwerp', away: 'Gent', date: '2026-06-15T16:00', matchday: 8 },
      { home: 'Standard', away: 'Westerlo', date: '2026-06-15T18:30', matchday: 8 },
      { home: 'OHL', away: 'Club Brugge', date: '2026-06-21T16:00', matchday: 9 },
      { home: 'Anderlecht', away: 'Genk', date: '2026-06-21T20:30', matchday: 9 },
      { home: 'Union SG', away: 'Antwerp', date: '2026-06-22T18:00', matchday: 9 },
      { home: 'Gent', away: 'Standard', date: '2026-06-22T20:30', matchday: 9 },
      { home: 'Westerlo', away: 'OHL', date: '2026-06-22T16:00', matchday: 9 },
    ],
  },
  bundesliga: {
    name: 'Bundesliga', flag: '🇩🇪', icon: '⚽',
    teams: [
      { name: 'Bayern Munich', strength: 94, form: 89, odds: 1.55, homeStr: 96, awayStr: 92, attack: 94, defense: 90, position: 1 },
      { name: 'Bayer Leverkusen', strength: 89, form: 92, odds: 3.2, homeStr: 90, awayStr: 86, attack: 92, defense: 84, position: 2 },
      { name: 'Borussia Dortmund', strength: 84, form: 80, odds: 6.5, homeStr: 88, awayStr: 80, attack: 85, defense: 78, position: 3 },
      { name: 'RB Leipzig', strength: 82, form: 78, odds: 9.0, homeStr: 84, awayStr: 79, attack: 82, defense: 80, position: 4 },
      { name: 'Stuttgart', strength: 77, form: 75, odds: 20.0, homeStr: 79, awayStr: 71, attack: 76, defense: 74, position: 5 },
      { name: 'Eintracht Frankfurt', strength: 75, form: 73, odds: 26.0, homeStr: 77, awayStr: 69, attack: 73, defense: 72, position: 6 },
      { name: 'Wolfsburg', strength: 70, form: 67, odds: 38.0, homeStr: 72, awayStr: 63, attack: 68, defense: 68, position: 7 },
      { name: 'Freiburg', strength: 68, form: 67, odds: 44.0, homeStr: 72, awayStr: 61, attack: 65, defense: 70, position: 8 },
      { name: 'Hoffenheim', strength: 64, form: 61, odds: 65.0, homeStr: 67, awayStr: 57, attack: 62, defense: 62, position: 9 },
      { name: 'Mainz', strength: 61, form: 59, odds: 85.0, homeStr: 65, awayStr: 53, attack: 59, defense: 60, position: 10 },
    ],
    matchdays: [
      { home: 'Bayern Munich', away: 'Bayer Leverkusen', date: '2026-06-13T18:30', matchday: 33 },
      { home: 'Borussia Dortmund', away: 'RB Leipzig', date: '2026-06-13T20:30', matchday: 33 },
      { home: 'Stuttgart', away: 'Eintracht Frankfurt', date: '2026-06-14T15:30', matchday: 33 },
      { home: 'Wolfsburg', away: 'Freiburg', date: '2026-06-14T15:30', matchday: 33 },
      { home: 'Hoffenheim', away: 'Mainz', date: '2026-06-14T15:30', matchday: 33 },
      { home: 'Bayer Leverkusen', away: 'Borussia Dortmund', date: '2026-06-20T18:30', matchday: 34 },
      { home: 'RB Leipzig', away: 'Bayern Munich', date: '2026-06-20T20:30', matchday: 34 },
      { home: 'Eintracht Frankfurt', away: 'Stuttgart', date: '2026-06-21T15:30', matchday: 34 },
      { home: 'Freiburg', away: 'Hoffenheim', date: '2026-06-21T15:30', matchday: 34 },
    ],
  },
};

function getTeam(leagueKey, name) {
  return LEAGUES[leagueKey].teams.find(t => t.name === name) || { strength: 65, form: 62, homeStr: 66, awayStr: 58, attack: 63, defense: 63, position: 10 };
}

function calcMatch(home, away) {
  const s1 = home.strength * 0.45 + home.form * 0.3 + home.homeStr * 0.25;
  const s2 = away.strength * 0.45 + away.form * 0.3 + away.awayStr * 0.25;
  const total = s1 + s2;
  const p1Raw = (s1 / total) * 100;
  const drawFactor = Math.max(15, 30 - Math.abs(p1Raw - 50) * 0.4);
  const p1 = Math.max(8, p1Raw - drawFactor * 0.3);
  const p2 = Math.max(8, 100 - p1Raw - drawFactor * 0.3);
  const draw = Math.max(10, 100 - p1 - p2);
  return { p1: Math.round(p1), draw: Math.round(draw), p2: Math.round(p2) };
}

function calcKairosIndex(home, away, prob, hasRealOdds) {
  let score = 450;
  const strDiff = home.strength - away.strength;
  score += Math.max(-80, Math.min(150, strDiff * 2.5));
  const formDiff = home.form - away.form;
  score += Math.max(-60, Math.min(120, formDiff * 2));
  const posDiff = away.position - home.position;
  score += Math.max(-50, Math.min(100, posDiff * 6));
  const homeAdv = home.homeStr - away.awayStr;
  score += Math.max(-30, Math.min(80, homeAdv * 1.5));
  if (hasRealOdds) score += 30;
  score += Math.max(-20, Math.min(50, (prob.p1 - 50) * 0.8));
  return Math.max(300, Math.min(950, Math.round(score)));
}

function formatDateTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('fr-BE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Brussels' }),
      time: d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' }),
    };
  } catch { return { date: '--/--', time: '--:--' }; }
}

function generateAllFixtures(leagueKey) {
  const league = LEAGUES[leagueKey];
  const seen = new Set();
  const fixtures = [];

  for (const match of league.matchdays) {
    const key = `${match.home}_${match.away}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const home = getTeam(leagueKey, match.home);
    const away = getTeam(leagueKey, match.away);
    const prob = calcMatch(home, away);
    const { date, time } = formatDateTime(match.date);

    const margin = 0.08;
    const homeOdd = parseFloat((100 / prob.p1 * (1 + margin)).toFixed(2));
    const drawOdd = parseFloat((100 / prob.draw * (1 + margin)).toFixed(2));
    const awayOdd = parseFloat((100 / prob.p2 * (1 + margin)).toFixed(2));

    const kairosIndex = calcKairosIndex(home, away, prob, false);
    const prediction = prob.p1 > prob.p2 + 12 ? match.home : prob.p2 > prob.p1 + 12 ? match.away : 'Nul possible';
    const bkProb = Math.round(100 / homeOdd);
    const valueDiff = prob.p1 - bkProb;

    fixtures.push({
      home: match.home, away: match.away,
      date, time, matchday: match.matchday,
      prob, odds: { home: homeOdd, draw: drawOdd, away: awayOdd },
      kairosIndex, prediction,
      confidence: Math.round(Math.max(prob.p1, prob.p2)),
      valueBet: valueDiff > 5 ? { isValue: true, value: Math.round(valueDiff), team: match.home } : null,
      homeStrength: home.strength, awayStrength: away.strength,
    });
  }

  return fixtures.sort((a, b) => b.kairosIndex - a.kairosIndex);
}

function simulateLeague(leagueKey) {
  const league = LEAGUES[leagueKey];
  const teams = league.teams;
  const wins = {};
  const top4 = {};
  const rel = {};
  teams.forEach(t => { wins[t.name] = 0; top4[t.name] = 0; rel[t.name] = 0; });

  const ITER = 10000;
  for (let i = 0; i < ITER; i++) {
    const pts = {};
    teams.forEach(t => { pts[t.name] = 0; });
    for (let a = 0; a < teams.length; a++) {
      for (let b = 0; b < teams.length; b++) {
        if (a === b) continue;
        const { p1, draw } = calcMatch(teams[a], teams[b]);
        const r = Math.random() * 100;
        if (r < p1) pts[teams[a].name] += 3;
        else if (r < p1 + draw) { pts[teams[a].name]++; pts[teams[b].name]++; }
        else pts[teams[b].name] += 3;
      }
    }
    const sorted = Object.entries(pts).sort((a, b) => b[1] - a[1]);
    wins[sorted[0][0]]++;
    sorted.slice(0, 4).forEach(([n]) => top4[n]++);
    sorted.slice(-3).forEach(([n]) => rel[n]++);
  }

  return teams.map(t => ({
    ...t,
    winPct: Math.round((wins[t.name] / ITER) * 100),
    top4Pct: Math.round((top4[t.name] / ITER) * 100),
    relPct: Math.round((rel[t.name] / ITER) * 100),
  })).sort((a, b) => b.winPct - a.winPct);
}

function formatTicketCopy(tickets, leagueName, leagueFlag, budget) {
  const now = new Date().toLocaleDateString('fr-BE');
  let txt = `⚡ KAIROS LEAGUES — ${now}\n${leagueFlag} ${leagueName}\n\n`;
  const labels = ['🟢 TICKET PREMIUM (TOP 3)', '🟡 TICKET ÉQUILIBRÉ (MILIEU)', '🔴 TICKET AVENTURE (OUTSIDERS)'];
  tickets.forEach((group, gi) => {
    const totalOdd = group.reduce((a, f) => a * f.odds.home, 1);
    const gain = (budget * totalOdd).toFixed(0);
    txt += `${labels[gi]}\n`;
    group.forEach(f => { txt += `${f.home} vs ${f.away} @${f.odds.home} · Indice ${f.kairosIndex}/1000 · ${f.time}\n`; });
    txt += `Cote totale : ${totalOdd.toFixed(2)} · Mise ${budget}€ → Gain ${gain}€\n\n`;
  });
  txt += `⚠️ Aucun pari n'est garanti. Jouez responsable.`;
  return txt;
}

const S = {
  app: { background: '#07090f', minHeight: '100vh', fontFamily: 'monospace' },
  shell: { maxWidth: 430, margin: '0 auto' },
  header: { padding: '14px 20px', borderBottom: '1px solid #1e2a40', background: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#0d1526', border: '1px solid #1e2a40', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  btn: { background: '#00FFB2', color: '#07090f', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 2 },
  btnGhost: (col='#00FFB2') => ({ background: 'transparent', color: col, border: `1px solid ${col}44`, borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%', textTransform: 'uppercase', letterSpacing: 1 }),
  tab: (a) => ({ flex: 1, background: a ? '#00FFB220' : 'transparent', border: `1px solid ${a ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '7px 2px', color: a ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 8, fontWeight: a ? 700 : 400, letterSpacing: 1, textTransform: 'uppercase' }),
  leagueBtn: (a) => ({ minWidth: 65, background: a ? '#00FFB215' : '#0d1526', border: `1px solid ${a ? '#00FFB244' : '#1e2a40'}`, borderRadius: 10, padding: '8px 4px', cursor: 'pointer', textAlign: 'center' }),
  label: { color: '#4a5568', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
};

const getColor = (p) => p >= 40 ? '#00FFB2' : p >= 20 ? '#7FFF00' : p >= 10 ? '#FFD700' : p >= 5 ? '#FF8C00' : '#FF4D6D';
const getIdxColor = (idx) => idx >= 800 ? '#00FFB2' : idx >= 700 ? '#FFD700' : idx >= 600 ? '#FF8C00' : '#FF4D6D';

export default function Leagues() {
  const [league, setLeague] = useState('serie_a');
  const [tab, setTab] = useState('tickets');
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [budget, setBudget] = useState(20);
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('kairos_auth') !== 'ok') {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    setSimResults(null);
    setFixtures(generateAllFixtures(league));
  }, [league]);

  const runSim = () => {
    setLoading(true);
    setTimeout(() => { setSimResults(simulateLeague(league)); setLoading(false); }, 50);
  };

  const l = LEAGUES[league];

  // 9 meilleurs matchs en 3 groupes de 3
  const top9 = fixtures.slice(0, 9);
  const ticketGroups = [top9.slice(0, 3), top9.slice(3, 6), top9.slice(6, 9)];
  const groupLabels = [
    { label: '🟢 TICKET PREMIUM', color: '#00FFB2', desc: 'Top 3 · Indices les plus élevés' },
    { label: '🟡 TICKET ÉQUILIBRÉ', color: '#FFD700', desc: 'Milieu · Bon rapport risque/gain' },
    { label: '🔴 TICKET AVENTURE', color: '#FF8C00', desc: 'Outsiders · Cotes élevées' },
  ];

  const copyTickets = () => {
    const txt = formatTicketCopy(ticketGroups, l.name, l.flag, budget);
    navigator.clipboard.writeText(txt).then(() => {
      setCopyMsg('✅ Copié !'); setTimeout(() => setCopyMsg(''), 3000);
    }).catch(() => { setCopyMsg('❌ Erreur'); setTimeout(() => setCopyMsg(''), 2000); });
  };

  const renderTickets = () => (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Budget */}
      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={S.label}>Budget par ticket (€)</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[10, 20, 50, 100].map(v => (
            <button key={v} onClick={() => setBudget(v)}
              style={{ flex: 1, background: budget === v ? '#00FFB220' : '#07090f', border: `1px solid ${budget === v ? '#00FFB2' : '#1e2a40'}`, borderRadius: 8, padding: '8px 0', color: budget === v ? '#00FFB2' : '#4a5568', cursor: 'pointer', fontSize: 12, fontWeight: budget === v ? 700 : 400 }}>
              {v}€
            </button>
          ))}
        </div>
      </div>

      {/* 3 tickets */}
      {ticketGroups.map((group, gi) => {
        const totalOdd = group.reduce((a, f) => a * f.odds.home, 1);
        const gain = (budget * totalOdd).toFixed(0);
        const avgIdx = Math.round(group.reduce((a, f) => a + f.kairosIndex, 0) / group.length);
        const { label, color, desc } = groupLabels[gi];

        return (
          <div key={gi} style={{ ...S.card, border: `1px solid ${color}44`, marginBottom: 14 }}>
            {/* Header ticket */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ color: '#4a5568', fontSize: 10, marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color, fontWeight: 900, fontSize: 20 }}>{avgIdx}</div>
                <div style={{ color: '#4a5568', fontSize: 8 }}>/1000 moy.</div>
              </div>
            </div>

            {/* Stats ticket */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
              {[['Cote totale', totalOdd.toFixed(2), color], ['Mise', `${budget}€`, '#4a5568'], ['Gain', `${gain}€`, '#00FFB2']].map(([lbl, val, col]) => (
                <div key={lbl} style={{ background: '#07090f', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                  <div style={{ color: col, fontWeight: 700, fontSize: 15 }}>{val}</div>
                  <div style={{ color: '#4a5568', fontSize: 8, marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Matchs */}
            {group.map((f, i) => (
              <div key={i} style={{ padding: '8px 0', borderTop: '1px solid #1e2a40' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{f.home}</div>
                    <div style={{ color: '#4a5568', fontSize: 10 }}>vs {f.away}</div>
                    <div style={{ color: '#4a5568', fontSize: 9, marginTop: 2 }}>📅 {f.date} ⏰ {f.time}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 8 }}>
                    <div style={{ color: getIdxColor(f.kairosIndex), fontWeight: 700, fontSize: 14 }}>{f.kairosIndex}</div>
                    <div style={{ color: '#4a5568', fontSize: 8 }}>/1000</div>
                    <div style={{ color: color, fontSize: 12, fontWeight: 700 }}>@{f.odds.home}</div>
                  </div>
                </div>
                {/* Probabilités */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[['1', f.prob.p1, '#00FFB2'], ['X', f.prob.draw, '#4a5568'], ['2', f.prob.p2, '#FF8C00']].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ flex: 1, background: '#07090f', borderRadius: 6, padding: '4px', textAlign: 'center' }}>
                      <div style={{ color: col, fontWeight: 700, fontSize: 12 }}>{val}%</div>
                      <div style={{ color: '#4a5568', fontSize: 8 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
                {/* Pronostic */}
                <div style={{ color: '#00FFB2', fontSize: 10, marginTop: 4 }}>
                  ✅ {f.prediction} ({f.confidence}% confiance)
                  {f.valueBet && <span style={{ color: '#FF6B00', marginLeft: 8 }}>🔥 VALUE +{f.valueBet.value}%</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Bouton copier tout */}
      {copyMsg && <div style={{ color: '#00FFB2', textAlign: 'center', fontSize: 13, marginBottom: 8, fontWeight: 700 }}>{copyMsg}</div>}
      <button style={S.btn} onClick={copyTickets}>📋 COPIER LES 3 TICKETS</button>
      <div style={{ color: '#4a5568', fontSize: 10, textAlign: 'center', marginTop: 6 }}>
        Colle le texte dans KAIROS pour analyse approfondie
      </div>
    </div>
  );

  const renderFixtures = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ ...S.card, background: '#FFD70015', border: '1px solid #FFD70044' }}>
        <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 13 }}>📅 {l.flag} {l.name} — JOURNÉE COMPLÈTE</div>
        <div style={{ color: '#4a5568', fontSize: 10, marginTop: 4 }}>Pronostics · Probabilités · Heures Brussels</div>
      </div>

      {fixtures.map((f, i) => (
        <div key={i} style={{ ...S.card, borderColor: f.kairosIndex >= 800 ? '#00FFB244' : f.kairosIndex >= 700 ? '#FFD70044' : '#1e2a40' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#4a5568', fontSize: 9, marginBottom: 3 }}>📅 {f.date} ⏰ {f.time} · J{f.matchday}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{f.home}</div>
              <div style={{ color: '#4a5568', fontSize: 10, margin: '2px 0' }}>vs</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{f.away}</div>
            </div>
            <div style={{ textAlign: 'center', marginLeft: 8 }}>
              <div style={{ color: getIdxColor(f.kairosIndex), fontWeight: 900, fontSize: 22 }}>{f.kairosIndex}</div>
              <div style={{ color: '#4a5568', fontSize: 8 }}>/1000</div>
              <div style={{ fontSize: 16 }}>{f.kairosIndex >= 800 ? '🟢' : f.kairosIndex >= 700 ? '🟡' : f.kairosIndex >= 600 ? '🟠' : '🔴'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {[['Dom.', f.prob.p1, '#00FFB2'], ['Nul', f.prob.draw, '#4a5568'], ['Ext.', f.prob.p2, '#FF8C00']].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: 1, background: '#07090f', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ color: col, fontWeight: 700, fontSize: 16 }}>{val}%</div>
                <div style={{ color: '#4a5568', fontSize: 8 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {[['1', f.odds.home, '#00FFB2'], ['X', f.odds.draw, '#4a5568'], ['2', f.odds.away, '#FF8C00']].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: 1, background: '#07090f', borderRadius: 6, padding: '4px', textAlign: 'center' }}>
                <div style={{ color: '#4a5568', fontSize: 8 }}>{lbl}</div>
                <div style={{ color: col, fontWeight: 700, fontSize: 13 }}>@{val}</div>
              </div>
            ))}
          </div>

          <div style={{ color: '#00FFB2', fontSize: 10 }}>
            ✅ {f.prediction} ({f.confidence}%)
            {f.valueBet && <span style={{ color: '#FF6B00', marginLeft: 8 }}>🔥 VALUE +{f.valueBet.value}%</span>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSeason = () => (
    <div style={{ padding: '16px 16px 100px' }}>
      {!simResults ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{l.flag}</div>
          <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{l.name}</div>
          <div style={{ color: '#4a5568', fontSize: 11, marginBottom: 24, lineHeight: 1.8 }}>Monte Carlo · 10 000 simulations<br />{l.teams.length} équipes · Saison complète</div>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, border: '3px solid #1e2a40', borderTop: '3px solid #00FFB2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: '#4a5568', fontSize: 11, letterSpacing: 2 }}>SIMULATION...</div>
              </div>
            : <button style={S.btn} onClick={runSim}>⚡ SIMULER LA SAISON</button>
          }
        </div>
      ) : (
        <>
          <div style={{ ...S.card, background: '#00FFB210', border: '1px solid #00FFB244', marginBottom: 12 }}>
            <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 13 }}>🎲 {l.flag} {l.name} — 10 000 SIMULATIONS</div>
          </div>
          <div style={S.card}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
              {['Équipe', 'Champ.', 'Top 4', 'Cote', 'Relég.'].map(h => (
                <div key={h} style={{ color: '#4a5568', fontSize: 8, textAlign: h === 'Équipe' ? 'left' : 'right', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {simResults.map((t, i) => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '7px 0', borderTop: '1px solid #1e2a40', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#4a5568', fontSize: 9, minWidth: 14 }}>{i+1}.</span>
                  <div style={{ color: i < 3 ? '#e2e8f0' : '#4a5568', fontSize: 11, fontWeight: i < 3 ? 700 : 400 }}>{t.name}</div>
                </div>
                <div style={{ color: getColor(t.winPct), fontWeight: 700, fontSize: 12, textAlign: 'right' }}>{t.winPct}%</div>
                <div style={{ color: getColor(t.top4Pct / 4), fontSize: 11, textAlign: 'right' }}>{t.top4Pct}%</div>
                <div style={{ color: '#4a5568', fontSize: 10, textAlign: 'right' }}>@{t.odds}</div>
                <div style={{ color: t.relPct > 20 ? '#FF4D6D' : '#4a5568', fontSize: 11, textAlign: 'right' }}>{t.relPct}%</div>
              </div>
            ))}
          </div>
          <button style={S.btnGhost()} onClick={runSim}>🔄 RELANCER</button>
        </>
      )}
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
              <div style={{ color: '#00FFB2', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>⚽ CHAMPIONNATS</div>
              <div style={{ color: '#4a5568', fontSize: 8, letterSpacing: 2 }}>KAIROS LEAGUE PREDICTOR</div>
            </div>
            <a href="/" style={{ color: '#4a5568', fontSize: 11, textDecoration: 'none' }}>← KAIROS</a>
          </div>

          {/* Sélecteur */}
          <div style={{ padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {Object.entries(LEAGUES).map(([key, lg]) => (
              <button key={key} style={{ ...S.leagueBtn(league === key), minWidth: 64 }} onClick={() => setLeague(key)}>
                <div style={{ fontSize: 20 }}>{lg.flag}</div>
                <div style={{ color: league === key ? '#00FFB2' : '#4a5568', fontSize: 7, marginTop: 2, letterSpacing: 1 }}>{lg.name}</div>
              </button>
            ))}
          </div>

          {/* Onglets */}
          <div style={{ padding: '6px 16px', display: 'flex', gap: 4 }}>
            {[['tickets','🎯 3 Tickets'],['fixtures','📅 Journée'],['season','🏆 Saison']].map(([id, lbl]) => (
              <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {tab === 'tickets' && renderTickets()}
          {tab === 'fixtures' && renderFixtures()}
          {tab === 'season' && renderSeason()}
        </div>
      </div>
    </>
  );
}
