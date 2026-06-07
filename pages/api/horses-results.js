// /api/horses-results.js
// Système d'apprentissage automatique KAIROS HORSES
// Enregistre les résultats et recalibre l'algorithme

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'POST') {
    return saveResult(req, res);
  } else {
    return getStats(req, res);
  }
}

// ── SAUVEGARDER UN RÉSULTAT ──────────────────────────────────────
async function saveResult(req, res) {
  try {
    const { race, horses, result, ticket } = req.body;

    // Enregistrer chaque cheval avec sa position réelle
    const entries = horses.map((h, i) => ({
      date: new Date().toISOString().split('T')[0],
      race_id: race.id,
      race_name: race.name,
      track: race.track,
      distance: race.distance,
      going: race.going,
      horse_name: h.name,
      horse_num: h.num,
      jockey: h.jockey,
      trainer: h.trainer,
      vh: h.vh || 0,
      musique: h.musique || '',
      odds: h.odds,
      kairos_index: h.kairosIndex,
      predicted_rank: i + 1, // rang prédit par KAIROS
      actual_rank: result.find(r => r.num === h.num)?.rank || 99,
      nb_courses: h.nbCourses || 0,
      nb_victoires: h.nbVictoires || 0,
      regularite: h.regularite || 0,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('ks_horses_results')
      .insert(entries);

    if (error) throw error;

    // Calculer les leçons apprises
    const lessons = analyzeResult(horses, result);

    return res.status(200).json({
      success: true,
      saved: entries.length,
      lessons,
      message: `${entries.length} chevaux enregistrés. KAIROS apprend !`
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── ANALYSER LES LEÇONS ──────────────────────────────────────────
function analyzeResult(horses, result) {
  const lessons = [];
  const sorted = [...horses].sort((a, b) => b.kairosIndex - a.kairosIndex);

  result.slice(0, 5).forEach(r => {
    const horse = horses.find(h => h.num === r.num);
    if (!horse) return;

    const predictedRank = sorted.findIndex(h => h.num === r.num) + 1;
    const actualRank = r.rank;

    if (actualRank <= 3 && predictedRank <= 3) {
      lessons.push(`✅ ${horse.name} — KAIROS correct (prédit #${predictedRank}, arrivé #${actualRank})`);
    } else if (actualRank <= 3 && predictedRank > 3) {
      lessons.push(`📚 ${horse.name} — surprenant (prédit #${predictedRank}, arrivé #${actualRank}) VH:${horse.vh} Jockey:${horse.jockey}`);
    } else if (actualRank > 5 && predictedRank <= 3) {
      lessons.push(`⚠️ ${horse.name} — surestimé (prédit #${predictedRank}, arrivé #${actualRank})`);
    }
  });

  return lessons;
}

// ── STATISTIQUES D'APPRENTISSAGE ─────────────────────────────────
async function getStats(req, res) {
  try {
    const { data, error } = await supabase
      .from('ks_horses_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(200).json({ success: true, stats: null, message: 'Pas encore de données' });
    }

    // Calculer les statistiques globales
    const total = data.length;
    const correct = data.filter(d => d.predicted_rank <= 3 && d.actual_rank <= 3).length;
    const precision = total > 0 ? Math.round(correct / total * 100) : 0;

    // Stats par jockey
    const jockeyStats = {};
    data.forEach(d => {
      if (!jockeyStats[d.jockey]) jockeyStats[d.jockey] = { correct: 0, total: 0 };
      jockeyStats[d.jockey].total++;
      if (d.predicted_rank <= 3 && d.actual_rank <= 3) jockeyStats[d.jockey].correct++;
    });

    // Stats par VH range
    const vhStats = { high: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, zero: { correct: 0, total: 0 } };
    data.forEach(d => {
      const key = d.vh > 40 ? 'high' : d.vh > 0 ? 'medium' : 'zero';
      vhStats[key].total++;
      if (d.actual_rank <= 3) vhStats[key].correct++;
    });

    // Stats par piste
    const trackStats = {};
    data.forEach(d => {
      if (!trackStats[d.track]) trackStats[d.track] = { correct: 0, total: 0 };
      trackStats[d.track].total++;
      if (d.predicted_rank <= 3 && d.actual_rank <= 3) trackStats[d.track].correct++;
    });

    // Derniers résultats
    const recent = data.slice(0, 20).map(d => ({
      date: d.date,
      race: d.race_name,
      horse: d.horse_name,
      predicted: d.predicted_rank,
      actual: d.actual_rank,
      vh: d.vh,
      jockey: d.jockey,
      correct: d.predicted_rank <= 3 && d.actual_rank <= 3,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        total,
        correct,
        precision,
        jockeyStats: Object.entries(jockeyStats)
          .map(([j, s]) => ({ jockey: j, precision: Math.round(s.correct / s.total * 100), total: s.total }))
          .sort((a, b) => b.precision - a.precision)
          .slice(0, 10),
        vhStats: {
          high: { ...vhStats.high, precision: vhStats.high.total > 0 ? Math.round(vhStats.high.correct / vhStats.high.total * 100) : 0 },
          medium: { ...vhStats.medium, precision: vhStats.medium.total > 0 ? Math.round(vhStats.medium.correct / vhStats.medium.total * 100) : 0 },
          zero: { ...vhStats.zero, precision: vhStats.zero.total > 0 ? Math.round(vhStats.zero.correct / vhStats.zero.total * 100) : 0 },
        },
        trackStats,
        recent,
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
