/**
 * KAIROS SPORT — Algorithme de scoring v2
 * Monte Carlo + Anti-piège + Value Bet avancé
 */

// ── SIMULATION MONTE CARLO ──────────────────────────────────────────
export function monteCarloSimulation(eventData, iterations = 10000) {
  const {
    formHome = 50, formAway = 50,
    motivationHome = 50, motivationAway = 50,
    fatigueHome = 0, fatigueAway = 0,
    injuriesHome = 0, injuriesAway = 0,
    h2hScore = 50,
    oddHome = 2.0, oddDraw = 3.2, oddAway = 3.5,
  } = eventData;

  // Calcul de la force de base de chaque équipe
  const homeStrength =
    (formHome * 0.30) +
    (motivationHome * 0.20) +
    ((100 - fatigueHome) * 0.15) +
    ((3 - injuriesHome) * 5 * 0.15) +
    (h2hScore * 0.20);

  const awayStrength =
    (formAway * 0.30) +
    (motivationAway * 0.20) +
    ((100 - fatigueAway) * 0.15) +
    ((3 - injuriesAway) * 5 * 0.15) +
    ((100 - h2hScore) * 0.20);

  const totalStrength = homeStrength + awayStrength + 20; // +20 avantage domicile
  const homeProb = (homeStrength + 10) / totalStrength;
  const awayProb = awayStrength / totalStrength;
  const drawProb = 1 - homeProb - awayProb;

  // Simulation Monte Carlo
  let homeWins = 0, draws = 0, awayWins = 0;

  for (let i = 0; i < iterations; i++) {
    const rand = Math.random();
    if (rand < homeProb) homeWins++;
    else if (rand < homeProb + Math.max(0, drawProb)) draws++;
    else awayWins++;
  }

  const homePct = Math.round((homeWins / iterations) * 100);
  const drawPct = Math.round((draws / iterations) * 100);
  const awayPct = Math.round((awayWins / iterations) * 100);

  // Value bet calculation
  const bookmakerHomePct = oddHome > 0 ? Math.round(100 / oddHome) : 50;
  const bookmakerDrawPct = oddDraw > 0 ? Math.round(100 / oddDraw) : 30;
  const bookmakerAwayPct = oddAway > 0 ? Math.round(100 / oddAway) : 30;

  const homeValue = homePct - bookmakerHomePct;
  const drawValue = drawPct - bookmakerDrawPct;
  const awayValue = awayPct - bookmakerAwayPct;

  // Meilleure value
  let bestBet = 'home';
  let bestValue = homeValue;
  if (drawValue > bestValue) { bestBet = 'draw'; bestValue = drawValue; }
  if (awayValue > bestValue) { bestBet = 'away'; bestValue = awayValue; }

  return {
    home: homePct,
    draw: drawPct,
    away: awayPct,
    bestBet,
    bestValue,
    isValueBet: bestValue >= 5,
    bookmaker: { home: bookmakerHomePct, draw: bookmakerDrawPct, away: bookmakerAwayPct },
  };
}

// ── DÉTECTEUR DE PIÈGE ──────────────────────────────────────────────
export function detectTrap(eventData) {
  const { oddHome = 2.0, formHome = 50, formAway = 50, motivationHome = 50, injuriesHome = 0 } = eventData;

  const traps = [];
  let trapScore = 0;

  // Favori avec cote très basse = risque piège
  if (oddHome < 1.30) {
    traps.push('Cote très basse — favori potentiellement surévalué');
    trapScore += 30;
  } else if (oddHome < 1.50) {
    traps.push('Favori court — risque de déception');
    trapScore += 15;
  }

  // Équipe favorite avec mauvaise forme récente
  if (oddHome < 1.70 && formHome < 40) {
    traps.push('Favori en mauvaise forme récente');
    trapScore += 25;
  }

  // Blessures chez le favori
  if (oddHome < 1.80 && injuriesHome >= 2) {
    traps.push(`${injuriesHome} blessés chez le favori`);
    trapScore += 20;
  }

  // Adversaire très motivé
  if (motivationHome < 40 && formAway > 70) {
    traps.push('Adversaire très motivé face à équipe peu motivée');
    trapScore += 20;
  }

  const isTrap = trapScore >= 30;

  return {
    isTrap,
    trapScore,
    traps,
    label: isTrap ? '🔴 Piège potentiel détecté' : '🟢 Valeur réelle détectée',
    color: isTrap ? '#FF4D6D' : '#00FFB2',
  };
}

// ── COACH PSYCHOLOGIQUE ─────────────────────────────────────────────
export function psychologicalCoach(history = []) {
  if (!history || history.length === 0) return null;

  const warnings = [];
  const today = new Date().toDateString();

  // Trop de paris aujourd'hui
  const todayBets = history.filter(h => new Date(h.savedAt).toDateString() === today);
  if (todayBets.length >= 3) {
    warnings.push({ type: 'overbet', message: `⚠️ ${todayBets.length} tickets aujourd'hui — risque de surpari.`, severity: 'high' });
  }

  // Chasse aux pertes (plusieurs pertes consécutives)
  const recent = history.slice(0, 5).filter(h => h.result !== 'pending');
  const recentLosses = recent.filter(h => h.result === 'loss');
  if (recentLosses.length >= 3) {
    warnings.push({ type: 'chasing', message: '🚨 3 pertes consécutives détectées — risque de chasse aux pertes.', severity: 'critical' });
  }

  // Mises croissantes après pertes (signe de tilt)
  if (history.length >= 3) {
    const lastThree = history.slice(0, 3);
    const stakes = lastThree.map(h => parseFloat(h.stake || 0));
    if (stakes[0] > stakes[1] * 1.5 && lastThree[1]?.result === 'loss') {
      warnings.push({ type: 'tilt', message: '⚠️ Mise en hausse après une perte — attention au tilt.', severity: 'high' });
    }
  }

  // ROI négatif persistant
  const finished = history.filter(h => h.result !== 'pending');
  if (finished.length >= 5) {
    const wins = finished.filter(h => h.result === 'win');
    const winRate = wins.length / finished.length;
    if (winRate < 0.3) {
      warnings.push({ type: 'performance', message: `📊 Taux de réussite à ${Math.round(winRate * 100)}% — revoir votre stratégie.`, severity: 'medium' });
    }
  }

  return warnings.length > 0 ? warnings : null;
}

// ── KAIROS SCORE PRINCIPAL ──────────────────────────────────────────
export function calculateKairosScore(eventData) {
  const breakdown = [];
  let total = 0;

  const {
    formHome = 50, formAway = 50,
    motivationHome = 50, motivationAway = 50,
    fatigueHome = 0, fatigueAway = 0,
    injuriesHome = 0, injuriesAway = 0,
    h2hFavorable = false, h2hScore = 50,
    weatherOk = true, surfaceFavorable = true,
    oddHome = 2.0, marketMovement = 0,
    smartMoneyHome = 50, dataCompleteness = 100,
    isTopLeague = false,
  } = eventData;

  // Bonus ligue premium
  if (isTopLeague) {
    breakdown.push({ label: 'Ligue premium (données fiables)', value: +5, good: true });
    total += 5;
  }

  // Forme récente
  const formDiff = formHome - formAway;
  if (formDiff > 20) {
    const pts = Math.min(20, Math.round(formDiff / 5));
    breakdown.push({ label: 'Forme récente excellente', value: +pts, good: true });
    total += pts;
  } else if (formDiff > 0) {
    const pts = Math.min(12, Math.round(formDiff / 4));
    breakdown.push({ label: 'Forme récente favorable', value: +pts, good: true });
    total += pts;
  }

  // Motivation
  const motivDiff = motivationHome - motivationAway;
  if (motivDiff > 15) {
    const pts = Math.min(15, Math.round(motivDiff / 5));
    breakdown.push({ label: 'Motivation élevée', value: +pts, good: true });
    total += pts;
  }

  // Blessures adversaires
  if (injuriesAway > 0) {
    const pts = Math.min(12, injuriesAway * 4);
    breakdown.push({ label: `Blessures adverses (${injuriesAway})`, value: +pts, good: true });
    total += pts;
  }

  // Smart Money
  if (smartMoneyHome > 60) {
    const pts = Math.min(10, Math.round((smartMoneyHome - 50) / 5));
    breakdown.push({ label: 'Smart Money favorable', value: +pts, good: true });
    total += pts;
  }

  // Fatigue adverse
  if (fatigueAway > 60) {
    const pts = Math.min(8, Math.round((fatigueAway - 50) / 6));
    breakdown.push({ label: 'Fatigue adverse', value: +pts, good: true });
    total += pts;
  }

  // H2H
  if (h2hFavorable) {
    const pts = Math.min(8, Math.round((h2hScore - 50) / 6));
    if (pts > 0) {
      breakdown.push({ label: 'H2H favorable', value: +pts, good: true });
      total += pts;
    }
  }

  // Météo
  if (weatherOk) {
    breakdown.push({ label: 'Conditions météo ok', value: +3, good: true });
    total += 3;
  }

  // Surface
  if (surfaceFavorable) {
    breakdown.push({ label: 'Surface favorable', value: +5, good: true });
    total += 5;
  }

  // Mouvement marché
  if (marketMovement > 0.1) {
    const pts = Math.min(10, Math.round(marketMovement * 20));
    breakdown.push({ label: 'Mouvement cotes favorable', value: +pts, good: true });
    total += pts;
  }

  // ── PÉNALITÉS ──

  // Blessures propres
  if (injuriesHome > 0) {
    const pen = Math.min(10, injuriesHome * 3);
    breakdown.push({ label: `Blessures propres (${injuriesHome})`, value: -pen, good: false });
    total -= pen;
  }

  // Fatigue propre
  if (fatigueHome > 60) {
    const pen = Math.min(8, Math.round((fatigueHome - 50) / 6));
    breakdown.push({ label: 'Fatigue propre', value: -pen, good: false });
    total -= pen;
  }

  // Données incomplètes
  if (dataCompleteness < 100) {
    const pen = Math.round((100 - dataCompleteness) / 10);
    if (pen > 0) {
      breakdown.push({ label: 'Données incomplètes', value: -pen, good: false });
      total -= pen;
    }
  }

  // Favori piège
  if (oddHome < 1.2) {
    breakdown.push({ label: 'Favori surcoté (risque piège)', value: -8, good: false });
    total -= 8;
  }

  const score = Math.max(0, Math.min(100, total + 40));

  let confidence = Math.round(dataCompleteness * 0.9);
  if (breakdown.length >= 5) confidence = Math.min(99, confidence + 5);
  if (isTopLeague) confidence = Math.min(99, confidence + 5);

  let dataQuality = 'Excellente';
  if (dataCompleteness < 50) dataQuality = 'Insuffisante';
  else if (dataCompleteness < 75) dataQuality = 'Partielle';
  else if (dataCompleteness < 90) dataQuality = 'Bonne';

  let recommendation = 'parier';
  if (dataQuality === 'Insuffisante') recommendation = 'ne pas parier';
  else if (score < 70) recommendation = 'ne pas parier';
  else if (score < 80) recommendation = 'surveiller';

  let riskLevel = 'Élevé';
  if (score >= 85) riskLevel = 'Faible';
  else if (score >= 75) riskLevel = 'Moyen';

  const probability = Math.round(score * 0.85);

  // Détection piège
  const trapData = detectTrap(eventData);

  // Pénalité si piège détecté
  const finalScore = trapData.isTrap ? Math.max(0, score - trapData.trapScore * 0.3) : score;

  return {
    score: Math.round(finalScore),
    breakdown,
    confidence,
    dataQuality,
    recommendation: trapData.isTrap && finalScore < 75 ? 'ne pas parier' : recommendation,
    riskLevel,
    probability,
    trapData,
  };
}

// ── VALUE BET ───────────────────────────────────────────────────────
export function calculateValue(oddBookmaker, probabilityKairos) {
  const impliedProb = 1 / oddBookmaker;
  const estimatedProb = probabilityKairos / 100;
  const value = (estimatedProb / impliedProb) - 1;
  return {
    value: Math.round(value * 100),
    isValueBet: value > 0.05,
    label: value > 0.1 ? 'Valeur excellente' : value > 0.05 ? 'Légère valeur' : 'Pas de valeur',
  };
}

// ── KELLY CRITERION ─────────────────────────────────────────────────
export function calculateStake(capital, probability, odd) {
  const p = probability / 100;
  const q = 1 - p;
  const b = odd - 1;
  const kelly = ((b * p) - q) / b;
  const kellyFraction = Math.max(0, kelly);
  return {
    prudent: Math.round(capital * kellyFraction * 0.25),
    balanced: Math.round(capital * kellyFraction * 0.5),
    aggressive: Math.round(capital * kellyFraction),
    recommended: Math.round(capital * kellyFraction * 0.35),
  };
}
