import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { betId, result, stake, gain } = req.body;

  try {
    if (betId) {
      const { error } = await supabase
        .from('ks_user_bets')
        .update({ result, stake, potential_gain: gain })
        .eq('id', betId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('ks_user_bets').insert({
        ticket_json: req.body.ticket || {},
        stake: stake || 0,
        potential_gain: gain || 0,
        total_odd: req.body.totalOdd || 1,
        result: result || 'pending',
      });
      if (error) throw error;
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
