/**
 * KAIROS SPORT — Moteur d'Intelligence Prédictive v3
 * Indice KAIROS sur 1000 points
 * Analyse multicouche : forme, classement, blessures, H2H, cotes, momentum, valeur
 */

// ── INDICE KAIROS 1000 POINTS ──────────────────────────────────────
export function calculateKairosIndex(data) {
  const {
    // Forme
    formHome = { score: 50, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
    formAway = { score: 50, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
    // Classement
    standingsHome = { position: 10, points: 0, played: 0 },
    standingsAway = { position: 10, points: 0, played: 0 },
    // Blessures
    injuriesHome = 0,
    injuriesAway = 0,
    // H2H
    h2h = { favorable: false, score: 50, homeWins: 0, awayWins: 0, draws: 0, total: 0 },
    // Cotes
    oddHome = 2.0,
    oddDraw = 3.2,
    oddAway = 3.5,
    hasRealOdds = false,
    // Contexte
    isTopLeague = false,
    isDecisiveMatch = false,
    isLowStakeMatch = false,
    homeAdvantage = true,
    // xG
    xGHome = null,
    xGAway = null,
    // Momentum
    momentumHome = 0,
    momentumAway = 0,
    // Météo
    weatherImpact = 0,
  } = data;

  let total = 0;
  const breakdown = [];
  const factors = [];

  // ── MODULE 1 : FORME RÉCENTE (max 200 pts) ──────────────────────
  const formDiff = formHome.score - formAway.score;
  const formPoints = Math.max(-100, Math.min(200, formDiff * 2));
  total += formPoints;
  if (formPoints > 0) {
    breakdown.push({ label: `Forme récente +${Math.round(formDiff)}pts`, value: Math.round(formPoints), good: true });
    factors.push(`✅ ${formHome.wins}V/${formHome.draws}N/${formHome.losses}D sur 5 matchs`);
  } else if (formPoints < 0) {
    breakdown.push({ label: 'Forme récente défavorable', value: Math.round(formPoints), good: false });
    factors.push(`⚠️ Forme insuffisante : ${formHome.wins}V/${formHome.draws}N/${formHome.losses}D`);
  }

  // ── MODULE 2 : CLASSEMENT (max 150 pts) ──────────────────────────
  const posDiff = standingsAway.position - standingsHome.position;
  const rankPoints = Math.max(-75, Math.min(150, posDiff * 5));
  total += rankPoints;
  if (posDiff > 3) {
    breakdown.push({ label: `Avantage classement (${standingsHome.position}e vs ${standingsAway.position}e)`, value: Math.round(rankPoints), good: true });
    factors.push(`✅ ${standingsHome.position}e au classement vs ${standingsAway.position}e`);
  } else if (posDiff < -3) {
    breakdown.push({ label: `Désavantage classement`, value: Math.round(rankPoints), good: false });
    factors.push(`⚠️ Adversaire mieux classé (${standingsAway.position}e vs ${standingsHome.position}e)`);
  }

  // ── MODULE 3 : BLESSURES (max 120 pts) ───────────────────────────
  const injuryBonus = Math.min(120, injuriesAway * 30);
  const injuryPenalty = Math.min(90, injuriesHome * 25);
  total += injuryBonus - injuryPenalty;
  if (injuriesAway > 0) {
    breakdown.push({ label: `Blessés adverses (${injuriesAway})`, value: injuryBonus, good: true });
    factors.push(`✅ ${injuriesAway} blessé(s) chez l'adversaire`);
  }
  if (injuriesHome > 0) {
    breakdown.push({ label: `Blessés propres (${injuriesHome})`, value: -injuryPenalty, good: false });
    factors.push(`⚠️ ${injuriesHome} blessé(s) dans l'équipe`);
  }

  // ── MODULE 4 : H2H (max 100 pts) ─────────────────────────────────
  if (h2h.total > 0) {
    const h2hScore = ((h2h.homeWins - h2h.awayWins) / h2h.total) * 100;
    const h2hPoints = Math.max(-50, Math.min(100, h2hScore));
    total += h2hPoints;
    if (h2hPoints > 20) {
      breakdown.push({ label: `H2H favorable (${h2h.homeWins}V/${h2h.total})`, value: Math.round(h2hPoints), good: true });
      factors.push(`✅ ${h2h.homeWins} victoires sur ${h2h.total} confrontations`);
    } else if (h2hPoints < -20) {
      breakdown.push({ label: `H2H défavorable`, value: Math.round(h2hPoints), good: false });
      factors.push(`⚠️ Historique défavorable contre cet adversaire`);
    }
  }

  // ── MODULE 5 : VALUE BET (max 150 pts) ────────────────────────────
  const totalOddProb = (1 / oddHome) + (1 / oddDraw) + (1 / oddAway);
  const bookmakerMargin = (totalOddProb - 1) * 100;
  const bookmakerProb = Math.round((1 / oddHome / totalOddProb) * 100);
  const estimatedProb = Math.round((formHome.score / (formHome.score + formAway.score)) * 100);
  const valueDiff = estimatedProb - bookmakerProb;
  const valuePoints = Math.max(-50, Math.min(150, valueDiff * 3));
  total += valuePoints;

  if (valueDiff > 8) {
    breakdown.push({ label: `Value bet exceptionnel +${Math.round(valueDiff)}%`, value: Math.round(valuePoints), good: true });
    factors.push(`🔥 Value bet : IA estime ${estimatedProb}% vs bookmaker ${bookmakerProb}%`);
  } else if (valueDiff > 4) {
    breakdown.push({ label: `Légère value +${Math.round(valueDiff)}%`, value: Math.round(valuePoints), good: true });
    factors.push(`✅ Légère valeur détectée (+${Math.round(valueDiff)}%)`);
  } else if (valueDiff < -5) {
    breakdown.push({ label: `Surcôté par bookmaker`, value: Math.round(valuePoints), good: false });
    factors.push(`⚠️ Cote surestimée par rapport à la probabilité réelle`);
  }

  // ── MODULE 6 : xG — STATISTIQUES AVANCÉES (max 100 pts) ──────────
  if (xGHome !== null && xGAway !== null) {
    const xGDiff = xGHome - xGAway;
    const xGPoints = Math.max(-50, Math.min(100, xGDiff * 20));
    total += xGPoints;
    if (xGPoints > 15) {
      breakdown.push({ label: `xG favorable (${xGHome} vs ${xGAway})`, value: Math.round(xGPoints), good: true });
      factors.push(`✅ Expected Goals : ${xGHome} vs ${xGAway}`);
    } else if (xGPoints < -15) {
      breakdown.push({ label: `xG défavorable`, value: Math.round(xGPoints), good: false });
      factors.push(`⚠️ Expected Goals défavorable : ${xGHome} vs ${xGAway}`);
    }
  }

  // ── MODULE 7 : MOMENTUM (max 80 pts) ─────────────────────────────
  const momentumDiff = momentumHome - momentumAway;
  const momentumPoints = Math.max(-40, Math.min(80, momentumDiff * 2));
  total += momentumPoints;
  if (momentumPoints > 20) {
    breakdown.push({ label: `Momentum positif`, value: Math.round(momentumPoints), good: true });
    factors.push(`✅ L'équipe est en montée de forme`);
  } else if (momentumPoints < -20) {
    breakdown.push({ label: `Momentum négatif`, value: Math.round(momentumPoints), good: false });
    factors.push(`⚠️ L'équipe est en baisse de forme`);
  }

  // ── MODULE 8 : CONTEXTE MATCH (max 80 pts) ────────────────────────
  if (isTopLeague) {
    total += 40;
    breakdown.push({ label: 'Ligue premium (données fiables)', value: +40, good: true });
  }
  if (hasRealOdds) {
    total += 30;
    breakdown.push({ label: 'Vraies cotes en temps réel', value: +30, good: true });
  }
  if (homeAdvantage) {
    total += 20;
    breakdown.push({ label: 'Avantage domicile', value: +20, good: true });
  }
  if (isDecisiveMatch) {
    total += 30;
    breakdown.push({ label: 'Match décisif (haute motivation)', value: +30, good: true });
    factors.push(`✅ Match à fort enjeu — motivation maximale`);
  }
  if (isLowStakeMatch) {
    total -= 80;
    breakdown.push({ label: 'Match sans enjeu (risque élevé)', value: -80, good: false });
    factors.push(`🔴 Match sans enjeu — risque de non-performance`);
  }

  // ── MODULE 9 : DÉTECTEUR DE PIÈGE (pénalités) ─────────────────────
  const traps = [];
  let trapPenalty = 0;

  if (oddHome < 1.25) {
    trapPenalty += 100;
    traps.push('Cote très basse — favori potentiellement surévalué');
  } else if (oddHome < 1.45) {
    trapPenalty += 50;
    traps.push('Favori court — risque de déception');
  }
  if (formHome.score < 35 && standingsHome.position > 15) {
    trapPenalty += 80;
    traps.push('Équipe en grande difficulté');
  }
  if (injuriesHome > 3) {
    trapPenalty += 60;
    traps.push(`${injuriesHome} blessés — effectif très diminué`);
  }
  if (isLowStakeMatch) {
    trapPenalty += 100;
    traps.push('Match sans enjeu — motivation douteuse');
  }

  total -= trapPenalty;
  const isTrap = trapPenalty >= 80;
  if (isTrap) {
    breakdown.push({ label: 'PIÈGE DÉTECTÉ', value: -trapPenalty, good: false });
  }

  // ── MODULE 10 : MÉTÉO ─────────────────────────────────────────────
  if (weatherImpact !== 0) {
    total += weatherImpact;
    breakdown.push({ label: weatherImpact > 0 ? 'Météo favorable' : 'Météo défavorable', value: weatherImpact, good: weatherImpact > 0 });
  }

  // ── CALCUL FINAL ──────────────────────────────────────────────────
  // Base de 450 points + tous les modules
  const rawIndex = total + 450;
  const kairosIndex = Math.max(0, Math.min(1000, Math.round(rawIndex)));

  // Classification
  let classification, classColor, classIcon, recommendation;
  if (kairosIndex >= 950) {
    classification = 'OPPORTUNITÉ EXCEPTIONNELLE';
    classColor = '#00FFB2';
    classIcon = '🟢';
    recommendation = 'parier';
  } else if (kairosIndex >= 900) {
    classification = 'TRÈS FORTE VALEUR';
    classColor = '#00FFB2';
    classIcon = '🟢';
    recommendation = 'parier';
  } else if (kairosIndex >= 850) {
    classification = 'BONNE OPPORTUNITÉ';
    classColor = '#7FFF00';
    classIcon = '🟢';
    recommendation = 'parier';
  } else if (kairosIndex >= 800) {
    classification = 'JOUABLE AVEC PRUDENCE';
    classColor = '#FFD700';
    classIcon = '🟡';
    recommendation = 'surveiller';
  } else if (kairosIndex >= 700) {
    classification = 'RISQUE ÉLEVÉ';
    classColor = '#FF8C00';
    classIcon = '🟠';
    recommendation = 'ne pas parier';
  } else {
    classification = 'PARI À ÉVITER';
    classColor = '#FF4D6D';
    classIcon = '🔴';
    recommendation = 'ne pas parier';
  }

  // Score sur 100 pour compatibilité
  const score100 = Math.round(kairosIndex / 10);
  const riskLevel = kairosIndex >= 850 ? 'Faible' : kairosIndex >= 750 ? 'Moyen' : 'Élevé';

  return {
    kairosIndex,
    score: score100,
    classification,
    classColor,
    classIcon,
    recommendation,
    riskLevel,
    breakdown,
    factors,
    confidence: Math.min(99, Math.round(kairosIndex / 11)),
    probability: Math.round(estimatedProb),
    dataQuality: isTopLeague && hasRealOdds ? 'Excellente' : isTopLeague ? 'Bonne' : 'Partielle',
    trapData: {
      isTrap,
      traps,
      label: isTrap ? '🔴 Piège potentiel détecté' : '🟢 Valeur réelle détectée',
      color: isTrap ? '#FF4D6D' : '#00FFB2',
      trapScore: trapPenalty,
    },
    valueBet: {
      bookmakerProb,
      kairosProb: estimatedProb,
      value: Math.round(valueDiff),
      isValue: valueDiff > 4,
      bookmakerMargin: Math.round(bookmakerMargin * 10) / 10,
      label: valueDiff > 8 ? 'Valeur exceptionnelle' : valueDiff > 4 ? 'Légère valeur' : 'Pas de valeur',
    },
    modules: {
      forme: Math.round(formPoints),
      classement: Math.round(rankPoints),
      blessures: injuryBonus - injuryPenalty,
      h2h: h2h.total > 0 ? Math.round(((h2h.homeWins - h2h.awayWins) / h2h.total) * 100) : 0,
      valueBet: Math.round(valuePoints),
      xG: xGHome !== null ? Math.round((xGHome - xGAway) * 20) : 0,
      momentum: Math.round(momentumPoints),
      contexte: (isTopLeague ? 40 : 0) + (hasRealOdds ? 30 : 0) + (homeAdvantage ? 20 : 0),
      pieges: -trapPenalty,
    },
  };
}

// ── SIMULATION MONTE CARLO ──────────────────────────────────────────
export function monteCarloSimulation(data, iterations = 10000) {
  const {
    formHome = { score: 50 },
    formAway = { score: 50 },
    oddHome = 2.0,
    oddDraw = 3.2,
    oddAway = 3.5,
  } = data;

  const totalStrength = formHome.score + formAway.score + 20;
  const homeProb = (formHome.score + 10) / totalStrength;
  const awayProb = formAway.score / totalStrength;
  const drawProb = Math.max(0, 1 - homeProb - awayProb);

  let homeWins = 0, draws = 0, awayWins = 0;
  for (let i = 0; i < iterations; i++) {
    const rand = Math.random();
    if (rand < homeProb) homeWins++;
    else if (rand < homeProb + drawProb) draws++;
    else awayWins++;
  }

  const homePct = Math.round((homeWins / iterations) * 100);
  const drawPct = Math.round((draws / iterations) * 100);
  const awayPct = Math.round((awayWins / iterations) * 100);

  const bookmakerHomePct = Math.round(100 / oddHome);
  const homeValue = homePct - bookmakerHomePct;

  return {
    home: homePct,
    draw: drawPct,
    away: awayPct,
    bestBet: homeValue > 5 ? 'home' : drawPct > 30 ? 'draw' : 'away',
    bestValue: homeValue,
    isValueBet: homeValue >= 5,
    iterations,
  };
}

// ── MOMENTUM ────────────────────────────────────────────────────────
export function calculateMomentum(recentResults = []) {
  if (!recentResults || recentResults.length === 0) return 0;
  let momentum = 0;
  const weights = [3, 2.5, 2, 1.5, 1, 0.8, 0.6, 0.4, 0.3, 0.2];
  recentResults.slice(0, 10).forEach((result, i) => {
    const weight = weights[i] || 0.2;
    if (result === 'W') momentum += 10 * weight;
    else if (result === 'D') momentum += 2 * weight;
    else if (result === 'L') momentum -= 8 * weight;
  });
  return Math.max(-50, Math.min(50, Math.round(momentum)));
}

// ── KELLY CRITERION ─────────────────────────────────────────────────
export function calculateKelly(bankroll, probability, odd) {
  const p = probability / 100;
  const q = 1 - p;
  const b = odd - 1;
  const kelly = ((b * p) - q) / b;
  const kellyFraction = Math.max(0, kelly);
  return {
    full: Math.round(bankroll * kellyFraction),
    half: Math.round(bankroll * kellyFraction * 0.5),
    quarter: Math.round(bankroll * kellyFraction * 0.25),
    recommended: Math.round(bankroll * kellyFraction * 0.35),
    kellyPct: Math.round(kellyFraction * 100),
  };
}

// ── COACH PSYCHOLOGIQUE ─────────────────────────────────────────────
export function psychologicalCoach(history = []) {
  if (!history || history.length === 0) return null;
  const warnings = [];
  const today = new Date().toDateString();

  const todayBets = history.filter(h => new Date(h.savedAt).toDateString() === today);
  if (todayBets.length >= 3) {
    warnings.push({ type: 'overbet', message: `⚠️ ${todayBets.length} tickets aujourd'hui — risque de surpari.`, severity: 'high' });
  }

  const recent = history.slice(0, 5).filter(h => h.result !== 'pending');
  const recentLosses = recent.filter(h => h.result === 'loss');
  if (recentLosses.length >= 3) {
    warnings.push({ type: 'chasing', message: '🚨 3 pertes consécutives — risque de chasse aux pertes.', severity: 'critical' });
  }

  if (history.length >= 3) {
    const lastThree = history.slice(0, 3);
    const stakes = lastThree.map(h => parseFloat(h.stake || 0));
    if (stakes[0] > stakes[1] * 1.5 && lastThree[1]?.result === 'loss') {
      warnings.push({ type: 'tilt', message: '⚠️ Mise en hausse après une perte — attention au tilt.', severity: 'high' });
    }
  }

  const finished = history.filter(h => h.result !== 'pending');
  if (finished.length >= 5) {
    const wins = finished.filter(h => h.result === 'win');
    const winRate = wins.length / finished.length;
    if (winRate < 0.3) {
      warnings.push({ type: 'performance', message: `📊 Taux de réussite à ${Math.round(winRate * 100)}% — revoir la stratégie.`, severity: 'medium' });
    }
  }

  return warnings.length > 0 ? warnings : null;
}

// ── VALEUR ATTENDUE ──────────────────────────────────────────────────
export function expectedValue(odd, probability, stake) {
  const p = probability / 100;
  const ev = (odd * p) - 1;
  const evAmount = stake * ev;
  return {
    ev: Math.round(ev * 100) / 100,
    evAmount: Math.round(evAmount),
    isPositive: ev > 0,
    label: ev > 0.1 ? 'EV très positif' : ev > 0 ? 'EV légèrement positif' : 'EV négatif',
  };
}
