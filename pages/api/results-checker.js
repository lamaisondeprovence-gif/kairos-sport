import { supabase } from '../../lib/supabase';

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function fetchF(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'x-rapidapi-key': API_FOOTBALL_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
      signal: AbortSignal.timeout(6000),
    });
    const d = await res.json();
    return d.response || [];
  } catch { return []; }
}

// Vérifier les résultats des prédictions en attente
async function checkPendingPredictions() {
  const { data: pending } = await supabase
    .from('ks_predictions')
    .select('*')
    .eq('result', 'pending')
    .lt('match_date', new Date().toISOString());

  if (!pending || pending.length === 0) return { checked: 0, updated: 0 };

  let updated = 0;

  for (const pred of pending) {
    try {
      // Chercher le résultat via API Football
      const fixtures = await fetchF(`/fixtures?id=${pred.fixture_id}`);
      if (!fixtures || fixtures.length === 0) continue;

      const fixture = fixtures[0];
      const status = fixture.fixture?.status?.short;

      // Match terminé
      if (['FT', 'AET', 'PEN'].includes(status)) {
        const homeGoals = fixture.goals?.home;
        const awayGoals = fixture.goals?.away;

        let result = 'draw';
        if (homeGoals > awayGoals) result = 'home';
        else if (awayGoals > homeGoals) result = 'away';

        // Comparer avec la prédiction KAIROS
        const correct = pred.prediction === result;

        // Calculer l'erreur de probabilité
        const actualProb = result === 'home' ? 100 : 0;
        const probError = Math.abs(pred.predicted_prob - actualProb);

        await supabase.from('ks_predictions').update({
          result,
          actual_home_goals: homeGoals,
          actual_away_goals: awayGoals,
          correct,
          prob_error: probError,
          checked_at: new Date().toISOString(),
        }).eq('id', pred.id);

        updated++;

        // Sauvegarder pour apprentissage
        await supabase.from('ks_learning').insert({
          league_id: pred.league_id,
          fixture_id: pred.fixture_id,
          home_team: pred.home_team,
          away_team: pred.away_team,
          kairos_index: pred.kairos_index,
          predicted_prob: pred.predicted_prob,
          actual_result: result,
          correct,
          prob_error: probError,
          home_strength: pred.home_strength,
          away_strength: pred.away_strength,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Check error:', e.message);
    }
  }

  return { checked: pending.length, updated };
}

// Statistiques d'apprentissage
async function getLearningStats() {
  const { data: records } = await supabase
    .from('ks_learning')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (!records || records.length === 0) {
    return {
      totalPredictions: 0,
      correctRate: 0,
      avgProbError: 0,
      byLeague: {},
      byKairosRange: {},
      insights: [],
    };
  }

  const total = records.length;
  const correct = records.filter(r => r.correct).length;
  const correctRate = Math.round((correct / total) * 100);
  const avgProbError = Math.round(records.reduce((a, r) => a + (r.prob_error || 0), 0) / total);

  // Stats par ligue
  const byLeague = {};
  records.forEach(r => {
    if (!byLeague[r.league_id]) byLeague[r.league_id] = { total: 0, correct: 0 };
    byLeague[r.league_id].total++;
    if (r.correct) byLeague[r.league_id].correct++;
  });

  // Stats par plage d'indice KAIROS
  const ranges = { '900+': [], '800-899': [], '700-799': [], '600-699': [], '<600': [] };
  records.forEach(r => {
    const idx = r.kairos_index || 0;
    if (idx >= 900) ranges['900+'].push(r);
    else if (idx >= 800) ranges['800-899'].push(r);
    else if (idx >= 700) ranges['700-799'].push(r);
    else if (idx >= 600) ranges['600-699'].push(r);
    else ranges['<600'].push(r);
  });

  const byKairosRange = {};
  Object.entries(ranges).forEach(([range, recs]) => {
    if (recs.length > 0) {
      const c = recs.filter(r => r.correct).length;
      byKairosRange[range] = {
        total: recs.length,
        correct: c,
        rate: Math.round((c / recs.length) * 100),
      };
    }
  });

  // Insights automatiques
  const insights = [];

  if (byKairosRange['900+']?.rate > 70) {
    insights.push({ type: 'success', message: `✅ Indice >900 : ${byKairosRange['900+'].rate}% de réussite — continuer à jouer ces matchs` });
  }
  if (byKairosRange['<600']?.rate < 40) {
    insights.push({ type: 'warning', message: `⚠️ Indice <600 : ${byKairosRange['<600']?.rate || 0}% de réussite — ÉVITER ces matchs` });
  }
  if (correctRate > 55) {
    insights.push({ type: 'success', message: `✅ Taux global ${correctRate}% — algorithme performant` });
  } else if (correctRate < 45) {
    insights.push({ type: 'warning', message: `⚠️ Taux global ${correctRate}% — ajustement de l'algorithme recommandé` });
  }

  return { totalPredictions: total, correctRate, avgProbError, byLeague, byKairosRange, insights };
}

// Sauvegarder une prédiction
async function savePrediction(prediction) {
  const { error } = await supabase.from('ks_predictions').insert({
    fixture_id: prediction.fixtureId,
    league_id: prediction.leagueId,
    home_team: prediction.home,
    away_team: prediction.away,
    match_date: prediction.matchDate,
    kairos_index: prediction.kairosIndex,
    predicted_prob: prediction.probability,
    prediction: prediction.prediction,
    home_strength: prediction.homeStrength,
    away_strength: prediction.awayStrength,
    result: 'pending',
  });
  return !error;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Récupérer les stats d'apprentissage
    const stats = await getLearningStats();
    return res.status(200).json({ success: true, stats });
  }

  if (req.method === 'POST') {
    const { action, prediction } = req.body;

    if (action === 'check') {
      const result = await checkPendingPredictions();
      return res.status(200).json({ success: true, ...result });
    }

    if (action === 'save' && prediction) {
      const saved = await savePrediction(prediction);
      return res.status(200).json({ success: saved });
    }

    // Enregistrement manuel d'un résultat
    if (action === 'manual') {
      const { home, away, prediction: pred, result, kairosIndex, probability } = req.body;
      const correct = pred === result;
      const probError = Math.abs((probability || 50) - (result === 'home' ? 100 : 0));

      await supabase.from('ks_learning').insert({
        home_team: home, away_team: away,
        kairos_index: kairosIndex,
        predicted_prob: probability || 50,
        actual_result: result,
        correct, prob_error: probError,
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, correct });
    }
  }

  return res.status(405).end();
}
