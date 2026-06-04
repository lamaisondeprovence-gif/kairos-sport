export function calculateKairosScore(eventData) {
  const breakdown = [];
  let total = 0;

  const {
    formHome = 50,
    formAway = 50,
    motivationHome = 50,
    motivationAway = 50,
    fatigueHome = 0,
    fatigueAway = 0,
    injuriesHome = 0,
    injuriesAway = 0,
    h2hFavorable = false,
    h2hScore = 50,
    weatherOk = true,
    surfaceFavorable = true,
    oddHome = 2.0,
    marketMovement = 0,
    smartMoneyHome = 50,
    dataCompleteness = 100,
  } = eventData;

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

  const motivDiff = motivationHome - motivationAway;
  if (motivDiff > 15) {
    const pts = Math.min(15, Math.round(motivDiff / 5));
    breakdown.push({ label: 'Motivation élevée', value: +pts, good: true });
    total += pts;
  }

  if (injuriesAway > 0) {
    const pts = Math.min(12, injuriesAway * 4);
    breakdown.push({ label: `Blessures adverses (${injuriesAway})`, value: +pts, good: true });
    total += pts;
  }

  if (smartMoneyHome > 60) {
    const pts = Math.min(10, Math.round((smartMoneyHome - 50) / 5));
    breakdown.push({ label: 'Smart Money favorable', value: +pts, good: true });
    total += pts;
  }

  if (fatigueAway > 60) {
    const pts = Math.min(8, Math.round((fatigueAway - 50) / 6));
    breakdown.push({ label: 'Fatigue adverse', value: +pts, good: true });
    total += pts;
  }

  if (h2hFavorable) {
    const pts = Math.min(8, Math.round((h2hScore - 50) / 6));
    if (pts > 0) {
      breakdown.push({ label: 'H2H favorable', value: +pts, good: true });
      total += pts;
    }
  }

  if (weatherOk) {
    breakdown.push({ label: 'Conditions météo ok', value: +3, good: true });
    total += 3;
  }

  if (surfaceFavorable) {
    breakdown.push({ label: 'Surface favorable', value: +5, good: true });
    total += 5;
  }

  if (marketMovement > 0.1) {
    const pts = Math.min(10, Math.round(marketMovement * 20));
    breakdown.push({ label: 'Mouvement cotes favorable', value: +pts, good: true });
    total += pts;
  }

  if (injuriesHome > 0) {
    const pen = Math.min(10, injuriesHome * 3);
    breakdown.push({ label: `Blessures propres (${injuriesHome})`, value: -pen, good: false });
    total -= pen;
  }

  if (fatigueHome > 60) {
    const pen = Math.min(8, Math.round((fatigueHome - 50) / 6));
    breakdown.push({ label: 'Fatigue propre', value: -pen, good: false });
    total -= pen;
  }

  if (dataCompleteness < 100) {
    const pen = Math.round((100 - dataCompleteness) / 10);
    if (pen > 0) {
      breakdown.push({ label: 'Données incomplètes', value: -pen, good: false });
      total -= pen;
    }
  }

  if (oddHome < 1.2) {
    breakdown.push({ label: 'Favori surcoté (risque piège)', value: -8, good: false });
    total -= 8;
  }

  const score = Math.max(0, Math.min(100, total + 40));
  let confidence = Math.round(dataCompleteness * 0.9);
  if (breakdown.length >= 5) confidence = Math.min(99, confidence + 5);

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

  return { score, breakdown, confidence, dataQuality, recommendation, riskLevel, probability };
}

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
