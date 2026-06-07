import { supabase } from '../../lib/supabase';

// ── GÉNÉRATEUR DE 10 ANS DE DONNÉES FICTIVES ─────────────────────────
const TEAMS_BY_LEAGUE = {
  serie_a: ['Inter Milan', 'Napoli', 'Atalanta', 'Juventus', 'AC Milan', 'Roma', 'Lazio', 'Fiorentina', 'Bologna', 'Torino', 'Udinese', 'Sassuolo', 'Verona', 'Monza', 'Lecce', 'Genoa', 'Salernitana', 'Frosinone', 'Empoli', 'Cagliari'],
  la_liga: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Bilbao', 'Villarreal', 'Real Sociedad', 'Betis', 'Sevilla', 'Valencia', 'Getafe', 'Osasuna', 'Mallorca', 'Las Palmas', 'Girona', 'Celta Vigo', 'Alaves', 'Cadiz', 'Granada', 'Almeria', 'Rayo'],
  ligue_1: ['PSG', 'Monaco', 'Lille', 'Brest', 'Nice', 'Lyon', 'Marseille', 'Rennes', 'Lens', 'Strasbourg', 'Montpellier', 'Nantes', 'Toulouse', 'Reims', 'Lorient', 'Metz', 'Clermont', 'Le Havre', 'Bordeaux', 'Saint-Etienne'],
  bundesliga: ['Bayern Munich', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'Stuttgart', 'Eintracht Frankfurt', 'Wolfsburg', 'Freiburg', 'Hoffenheim', 'Mainz', 'Augsburg', 'Werder Bremen', 'Cologne', 'Union Berlin', 'Bochum', 'Heidenheim', 'Darmstadt', 'Schalke'],
  pro_league: ['Club Brugge', 'Anderlecht', 'Genk', 'Union SG', 'Antwerp', 'Gent', 'Standard', 'Westerlo', 'OHL', 'Cercle Brugge', 'Charleroi', 'Mechelen', 'Zulte Waregem', 'Kortrijk', 'Sint-Truiden', 'Eupen'],
};

const TEAM_STRENGTH = {
  'Inter Milan': 92, 'Napoli': 88, 'Atalanta': 86, 'Juventus': 84, 'AC Milan': 82,
  'Real Madrid': 95, 'Barcelona': 90, 'Atletico Madrid': 85,
  'PSG': 94, 'Monaco': 82, 'Lille': 78,
  'Bayern Munich': 94, 'Bayer Leverkusen': 89, 'Borussia Dortmund': 84, 'RB Leipzig': 82,
  'Club Brugge': 83, 'Anderlecht': 79, 'Genk': 76,
};

function getStrength(team) {
  return TEAM_STRENGTH[team] || Math.floor(Math.random() * 30) + 55;
}

function simulateMatch(homeStr, awayStr) {
  const homeAdv = 8;
  const s1 = homeStr + homeAdv + (Math.random() * 20 - 10);
  const s2 = awayStr + (Math.random() * 20 - 10);
  const total = s1 + s2;
  const p1 = (s1 / total) * 100;
  const drawChance = Math.max(15, 30 - Math.abs(p1 - 50) * 0.4);
  const r = Math.random() * 100;
  if (r < p1 - drawChance/2) return 'home';
  if (r < p1 + drawChance/2) return 'draw';
  return 'away';
}

function calcKairosIndexSim(homeStr, awayStr, hasRealOdds = false) {
  let score = 450;
  const diff = homeStr - awayStr;
  score += Math.max(-100, Math.min(180, diff * 2.8));
  score += Math.random() * 40 - 20; // variance
  if (hasRealOdds) score += 30;
  score += 20; // avantage domicile
  return Math.max(300, Math.min(950, Math.round(score)));
}

function generateHistoricalData(yearsBack = 10) {
  const records = [];
  const now = new Date();
  const leagues = Object.keys(TEAMS_BY_LEAGUE);

  for (let year = yearsBack; year >= 1; year--) {
    for (const leagueKey of leagues) {
      const teams = TEAMS_BY_LEAGUE[leagueKey];
      // ~30 journées par saison, ~5 matchs par journée
      for (let matchday = 1; matchday <= 30; matchday++) {
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const matchesPerDay = Math.min(5, Math.floor(shuffled.length / 2));

        for (let m = 0; m < matchesPerDay; m++) {
          const home = shuffled[m * 2];
          const away = shuffled[m * 2 + 1];
          if (!home || !away) continue;

          const homeStr = getStrength(home);
          const awayStr = getStrength(away);
          const kairosIndex = calcKairosIndexSim(homeStr, awayStr);
          const prediction = homeStr > awayStr + 10 ? 'home' : awayStr > homeStr + 10 ? 'away' : 'draw';
          const actualResult = simulateMatch(homeStr, awayStr);
          const correct = prediction === actualResult;
          const predictedProb = Math.round((homeStr / (homeStr + awayStr)) * 100);
          const probError = Math.abs(predictedProb - (actualResult === 'home' ? 100 : 0));

          const matchDate = new Date(now);
          matchDate.setFullYear(now.getFullYear() - year);
          matchDate.setMonth(Math.floor(Math.random() * 10));
          matchDate.setDate(Math.floor(Math.random() * 28) + 1);

          records.push({
            league_id: leagueKey,
            home_team: home,
            away_team: away,
            kairos_index: kairosIndex,
            predicted_prob: predictedProb,
            actual_result: actualResult,
            correct,
            prob_error: probError,
            home_strength: homeStr,
            away_strength: awayStr,
            season: `${now.getFullYear() - year}-${now.getFullYear() - year + 1}`,
            created_at: matchDate.toISOString(),
          });
        }
      }
    }
  }

  return records;
}

// Calculer les ajustements d'algorithme basés sur l'apprentissage
function calculateAlgorithmAdjustments(records) {
  const adjustments = {
    homeAdvantageBonus: 0,
    strengthWeight: 0,
    drawBias: 0,
    byLeague: {},
    byIndexRange: {},
    insights: [],
  };

  if (!records || records.length === 0) return adjustments;

  // Analyse par plage d'indice
  const ranges = { '<500': [], '500-599': [], '600-699': [], '700-799': [], '800-899': [], '900+': [] };
  records.forEach(r => {
    const idx = r.kairos_index || 0;
    const range = idx >= 900 ? '900+' : idx >= 800 ? '800-899' : idx >= 700 ? '700-799' : idx >= 600 ? '600-699' : idx >= 500 ? '500-599' : '<500';
    ranges[range].push(r);
  });

  let bestRange = null, bestRate = 0;
  let worstRange = null, worstRate = 100;

  Object.entries(ranges).forEach(([range, recs]) => {
    if (recs.length === 0) return;
    const correct = recs.filter(r => r.correct).length;
    const rate = Math.round((correct / recs.length) * 100);
    adjustments.byIndexRange[range] = { total: recs.length, correct, rate };
    if (rate > bestRate) { bestRate = rate; bestRange = range; }
    if (rate < worstRate) { worstRate = rate; worstRange = range; }
  });

  // Analyse avantage domicile
  const homeWins = records.filter(r => r.actual_result === 'home').length;
  const homeWinRate = Math.round((homeWins / records.length) * 100);
  const drawRate = Math.round((records.filter(r => r.actual_result === 'draw').length / records.length) * 100);

  adjustments.homeWinRate = homeWinRate;
  adjustments.drawRate = drawRate;

  // Insights
  if (bestRange) adjustments.insights.push({ type: 'success', msg: `✅ Meilleure plage : Indice ${bestRange} → ${bestRate}% de réussite` });
  if (worstRange) adjustments.insights.push({ type: 'warning', msg: `⚠️ Pire plage : Indice ${worstRange} → ${worstRate}% — à éviter` });
  adjustments.insights.push({ type: 'info', msg: `📊 Domicile gagne ${homeWinRate}% · Nul ${drawRate}% · Extérieur ${100-homeWinRate-drawRate}%` });

  // Ajustement recommandé
  if (homeWinRate > 50) {
    adjustments.homeAdvantageBonus = Math.round((homeWinRate - 45) * 0.5);
    adjustments.insights.push({ type: 'adjust', msg: `🔧 Bonus avantage domicile recommandé : +${adjustments.homeAdvantageBonus} pts` });
  }

  // Précision globale
  const totalCorrect = records.filter(r => r.correct).length;
  const globalRate = Math.round((totalCorrect / records.length) * 100);
  adjustments.globalRate = globalRate;
  adjustments.totalRecords = records.length;

  if (globalRate >= 55) {
    adjustments.insights.push({ type: 'success', msg: `🏆 Algorithme précis : ${globalRate}% sur ${records.length.toLocaleString()} matchs` });
  } else {
    adjustments.insights.push({ type: 'warning', msg: `📈 Précision ${globalRate}% sur ${records.length.toLocaleString()} matchs — en amélioration` });
  }

  return adjustments;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action } = req.body;

  // ── ACTION 1 : Générer et sauvegarder 10 ans de données fictives
  if (action === 'generate_historical') {
    try {
      // Vérifier si données déjà générées
      const { count } = await supabase.from('ks_learning').select('*', { count: 'exact', head: true });
      if (count > 1000) {
        return res.status(200).json({
          success: true,
          message: `Données déjà présentes : ${count} matchs`,
          alreadyExists: true,
        });
      }

      const records = generateHistoricalData(10);

      // Insérer par batch de 500
      let inserted = 0;
      for (let i = 0; i < records.length; i += 500) {
        const batch = records.slice(i, i + 500);
        const { error } = await supabase.from('ks_learning').insert(batch);
        if (!error) inserted += batch.length;
      }

      const adjustments = calculateAlgorithmAdjustments(records);

      // Sauvegarder les ajustements
      await supabase.from('ks_algorithm_config').upsert({
        id: 'main',
        home_advantage_bonus: adjustments.homeAdvantageBonus,
        global_accuracy: adjustments.globalRate,
        total_training_records: inserted,
        by_index_range: adjustments.byIndexRange,
        insights: adjustments.insights,
        last_trained: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        inserted,
        adjustments,
        message: `✅ ${inserted.toLocaleString()} matchs générés sur 10 ans · Algorithme calibré`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── ACTION 2 : Mise à jour hebdomadaire avec vrais résultats
  if (action === 'weekly_update') {
    try {
      // Récupérer prédictions de la semaine passée
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: weekPredictions } = await supabase
        .from('ks_predictions')
        .select('*')
        .gte('created_at', oneWeekAgo)
        .neq('result', 'pending');

      if (!weekPredictions || weekPredictions.length === 0) {
        return res.status(200).json({ success: true, message: 'Aucune prédiction à analyser cette semaine', updated: 0 });
      }

      // Ajouter dans ks_learning
      const learningRecords = weekPredictions.map(p => ({
        league_id: p.league_id,
        fixture_id: p.fixture_id,
        home_team: p.home_team,
        away_team: p.away_team,
        kairos_index: p.kairos_index,
        predicted_prob: p.predicted_prob,
        actual_result: p.result,
        correct: p.correct,
        prob_error: p.prob_error,
        home_strength: p.home_strength,
        away_strength: p.away_strength,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('ks_learning').insert(learningRecords);

      // Recalculer les ajustements
      const { data: allRecords } = await supabase.from('ks_learning').select('*').limit(10000);
      const adjustments = calculateAlgorithmAdjustments(allRecords);

      // Mettre à jour la config
      await supabase.from('ks_algorithm_config').upsert({
        id: 'main',
        home_advantage_bonus: adjustments.homeAdvantageBonus,
        global_accuracy: adjustments.globalRate,
        total_training_records: allRecords?.length || 0,
        by_index_range: adjustments.byIndexRange,
        insights: adjustments.insights,
        last_updated: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        updated: weekPredictions.length,
        adjustments,
        message: `✅ ${weekPredictions.length} prédictions analysées · Algorithme mis à jour`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── ACTION 3 : Récupérer la config actuelle
  if (action === 'get_config') {
    try {
      const { data: config } = await supabase
        .from('ks_algorithm_config')
        .select('*')
        .eq('id', 'main')
        .single();

      const { count } = await supabase
        .from('ks_learning')
        .select('*', { count: 'exact', head: true });

      return res.status(200).json({
        success: true,
        config: config || null,
        totalRecords: count || 0,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── ACTION 4 : Stats détaillées
  if (action === 'get_stats') {
    try {
      const { data: records } = await supabase
        .from('ks_learning')
        .select('kairos_index, correct, actual_result, league_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);

      const adjustments = calculateAlgorithmAdjustments(records);

      return res.status(200).json({ success: true, adjustments, totalRecords: records?.length || 0 });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ success: false, error: 'Action inconnue' });
}
