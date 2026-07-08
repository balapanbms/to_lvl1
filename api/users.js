const { getSupabaseAdmin, sendJson, readJson } = require('./_lib/supabase');

function cleanUsername(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 50);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    const body = await readJson(req);
    const username = cleanUsername(body.username);

    if (!username || username.length < 3) {
      return sendJson(res, 400, { error: 'Username minimal 3 karakter.' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .upsert({ username }, { onConflict: 'username' })
      .select('*')
      .single();

    if (error) throw error;
    return sendJson(res, 200, { user: data });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Gagal menyimpan username.' });
  }
};
