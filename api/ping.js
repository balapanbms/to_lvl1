const { getSupabaseAdmin, sendJson } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    return sendJson(res, 200, {
      ok: true,
      message: 'Ping berhasil. Supabase aktif.',
      rows_checked: Array.isArray(data) ? data.length : 0,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      message: error.message || 'Ping gagal.',
      checked_at: new Date().toISOString(),
    });
  }
};
