const { getSupabaseAdmin, sendJson } = require('./_lib/supabase');

function cleanUsername(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 50);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const username = cleanUsername(url.searchParams.get('username'));
    if (!username || username.length < 3) {
      return sendJson(res, 400, { error: 'Username minimal 3 karakter.' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, username, paket, score, total_questions, correct_count, wrong_count, empty_count, is_passed, finished_at, duration_seconds')
      .eq('username', username)
      .order('finished_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const history = (data || []).map((item) => ({
      serverId: item.id,
      username: item.username,
      pkgName: item.paket,
      score: Number(item.score || 0),
      correct: Number(item.correct_count || 0),
      wrong: Number(item.wrong_count || 0),
      blank: Number(item.empty_count || 0),
      isPassed: Boolean(item.is_passed),
      finishedAt: item.finished_at ? new Date(item.finished_at).toLocaleString('id-ID') : '-',
      finishedAtRaw: item.finished_at || '',
      durationSeconds: Number(item.duration_seconds || 0),
      source: 'server',
    }));

    return sendJson(res, 200, { history });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Gagal mengambil riwayat user.' });
  }
};
