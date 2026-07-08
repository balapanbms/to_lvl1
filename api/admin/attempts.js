const { getSupabaseAdmin, checkAdminPin, sendJson } = require('../_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    if (!checkAdminPin(req)) return sendJson(res, 401, { error: 'PIN admin salah.' });

    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const username = url.searchParams.get('username') || '';
    const paket = url.searchParams.get('paket') || '';

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('quiz_attempts')
      .select('*, quiz_answers(*)')
      .order('finished_at', { ascending: false })
      .limit(500);

    if (username) query = query.ilike('username', `%${username}%`);
    if (paket) query = query.eq('paket', paket);

    const { data, error } = await query;
    if (error) throw error;
    return sendJson(res, 200, { attempts: data || [] });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Gagal mengambil history.' });
  }
};
