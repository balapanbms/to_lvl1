const { getSupabaseAdmin, sendJson, readJson } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method tidak diizinkan.' });
  try {
    const body = await readJson(req);
    const username = String(body.username || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 50);
    const paket = String(body.paket || '').trim().slice(0, 100);
    const answers = Array.isArray(body.answers) ? body.answers : [];

    if (!username || !paket) {
      return sendJson(res, 400, { error: 'Username dan paket wajib ada.' });
    }

    const supabase = getSupabaseAdmin();
    await supabase.from('users').upsert({ username }, { onConflict: 'username' });

    const attemptPayload = {
      username,
      paket,
      score: Number(body.score || 0),
      total_questions: Number(body.totalQuestions || 0),
      correct_count: Number(body.correctCount || 0),
      wrong_count: Number(body.wrongCount || 0),
      empty_count: Number(body.emptyCount || 0),
      doubtful_count: Number(body.doubtfulCount || 0),
      is_passed: Boolean(body.isPassed),
      started_at: body.startedAt ? new Date(body.startedAt).toISOString() : new Date().toISOString(),
      finished_at: body.finishedAt ? new Date(body.finishedAt).toISOString() : new Date().toISOString(),
      duration_seconds: Number(body.durationSeconds || 0),
    };

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert(attemptPayload)
      .select('*')
      .single();

    if (attemptError) throw attemptError;

    if (answers.length) {
      const answerRows = answers.map((item) => ({
        attempt_id: attempt.id,
        question_id: String(item.questionId || ''),
        question_number: Number(item.nomor || 0),
        question_text: String(item.questionText || ''),
        option_a: String((item.options && item.options.A) || ''),
        option_b: String((item.options && item.options.B) || ''),
        option_c: String((item.options && item.options.C) || ''),
        option_d: String((item.options && item.options.D) || ''),
        selected_answer: item.selectedAnswer ? String(item.selectedAnswer) : null,
        correct_answer: String(item.correctAnswer || ''),
        is_correct: Boolean(item.isCorrect),
        is_doubtful: Boolean(item.isDoubtful),
        materi: String(item.materi || ''),
        tag: String(item.tag || ''),
        pembahasan: String(item.pembahasan || ''),
        referensi: String(item.referensi || ''),
      }));

      const { error: answersError } = await supabase.from('quiz_answers').insert(answerRows);
      if (answersError) throw answersError;
    }

    return sendJson(res, 200, { attemptId: attempt.id });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Gagal menyimpan hasil.' });
  }
};
