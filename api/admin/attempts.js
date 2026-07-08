const { getSupabaseAdmin, checkAdminPin, sendJson } = require('../_lib/supabase');

function clean(value, max = 100) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    if (!checkAdminPin(req)) return sendJson(res, 401, { error: 'PIN admin salah.' });

    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const username = clean(url.searchParams.get('username'), 50).toLowerCase();
    const paket = clean(url.searchParams.get('paket'), 100);

    const supabase = getSupabaseAdmin();

    let attemptsQuery = supabase
      .from('quiz_attempts')
      .select('*')
      .order('finished_at', { ascending: false })
      .limit(500);

    if (username) attemptsQuery = attemptsQuery.ilike('username', `%${username}%`);
    if (paket) attemptsQuery = attemptsQuery.eq('paket', paket);

    const { data: attempts, error: attemptsError } = await attemptsQuery;
    if (attemptsError) throw attemptsError;

    const rows = attempts || [];
    const ids = rows.map((item) => item.id).filter(Boolean);
    let answersByAttempt = {};

    if (ids.length) {
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('attempt_id', ids)
        .order('question_number', { ascending: true });

      if (answersError) {
        // Jangan kosongkan daftar history hanya karena detail jawaban gagal dibaca.
        console.warn('Gagal membaca quiz_answers:', answersError.message);
      } else {
        answersByAttempt = (answers || []).reduce((acc, item) => {
          const key = item.attempt_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});
      }
    }

    const result = rows.map((item) => ({
      ...item,
      quiz_answers: answersByAttempt[item.id] || [],
    }));

    return sendJson(res, 200, { attempts: result });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || 'Gagal mengambil history.',
      hint: 'Cek SUPABASE_SERVICE_ROLE_KEY, ADMIN_PIN, dan pastikan supabase-schema.sql sudah dijalankan.',
    });
  }
};
