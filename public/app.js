const DURATION_SECONDS = 120 * 60;
const KOMPOSISI = [
  ['Manajemen Rantai Pasok', 3],
  ['Pengantar PBJP', 18],
  ['Perencanaan PBJP', 22],
  ['Pemilihan Penyedia', 25],
  ['Pengelolaan Kontrak', 19],
  ['Kompetensi Gabungan', 2],
  ['Swakelola', 11],
];
const state = { bankSoal: [], username: '', paket: '', questions: [], current: 0, answers: {}, doubtful: {}, startedAt: null, remaining: DURATION_SECONDS, timer: null, submitting: false, result: null, error: '' };
const app = document.getElementById('app');

function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[m])); }
function formatTime(seconds) { const m = Math.floor(seconds / 60).toString().padStart(2,'0'); const s = Math.floor(seconds % 60).toString().padStart(2,'0'); return `${m}:${s}`; }
function formatDuration(seconds) { const s = Number(seconds || 0); return `${Math.floor(s / 60)}m ${s % 60}s`; }
function getRoute() { const hash = location.hash.replace(/^#/, ''); if (hash.startsWith('quiz/')) return { page:'quiz', paket: decodeURIComponent(hash.slice(5)) }; return { page:'home' }; }
function header(title='Simulasi PBJP Level-1', sub='Paket A-C sesuai komposisi ujian') { return `<div class="header"><div class="header-inner"><div><div class="brand">${esc(title)}</div><div style="opacity:.82;margin-top:3px">${sub}</div></div><div class="nav">${state.username ? `<span style="padding:9px 0">User: <b>${esc(state.username)}</b></span>` : ''}<a href="/admin/">Admin</a>${state.username ? `<button id="logoutBtn">Ganti Username</button>` : ''}</div></div></div>`; }
function bindHeader() { const btn = document.getElementById('logoutBtn'); if (btn) btn.onclick = () => { localStorage.removeItem('pbj_username'); state.username = ''; location.hash = ''; render(); }; }
async function loadBank() { const res = await fetch('/data/bankSoal.json'); state.bankSoal = await res.json(); }

function renderUsernameGate() {
  app.innerHTML = `${header()}<main class="container"><div class="hero"><section class="card"><h1 class="h1">Masuk dulu dengan username</h1><p class="lead">Username dipakai untuk menyimpan riwayat pengerjaan soal, nilai, waktu selesai, dan detail jawaban agar bisa dicek dari panel admin.</p><form id="usernameForm" style="margin-top:22px"><div class="form-row"><input class="input" id="usernameInput" placeholder="Contoh: peserta01" autofocus><button class="btn" id="usernameBtn">Mulai</button></div><p id="usernameError" class="error" style="margin-top:12px"></p></form></section><aside class="card"><h3 style="margin-top:0">Komposisi ujian</h3><p class="lead">100 soal pilihan ganda, waktu 120 menit, passing grade 65.</p><div style="margin-top:14px">${KOMPOSISI.map(([n,j])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>${esc(n)}</span><b>${j} soal</b></div>`).join('')}</div></aside></div></main>`;
  bindHeader();
  document.getElementById('usernameForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('usernameInput');
    const btn = document.getElementById('usernameBtn');
    const error = document.getElementById('usernameError');
    const username = input.value.trim();
    error.textContent = '';
    if (username.length < 3) { error.textContent = 'Username minimal 3 karakter.'; return; }
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      const res = await fetch('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan username.');
      localStorage.setItem('pbj_username', username); state.username = username; render();
    } catch (err) { error.textContent = err.message; }
    finally { btn.disabled = false; btn.textContent = 'Mulai'; }
  };
}

function renderHome() {
  if (!state.username) return renderUsernameGate();
  const allowed = ['Paket A','Paket B','Paket C'];
  const cards = allowed.map(paket => { const list = state.bankSoal.filter(q=>q.paket===paket); const materiCount = new Set(list.map(q=>q.materi)).size; return `<div class="package"><h3>${esc(paket)}</h3><p style="color:var(--muted);line-height:1.5">Simulasi 120 menit dengan nilai akhir skala 0-100.</p><div class="meta"><span class="badge">${list.length} soal</span><span class="badge">${materiCount} materi</span><span class="badge">PG 65</span></div><a class="btn" href="#quiz/${encodeURIComponent(paket)}">Kerjakan</a></div>`; }).join('');
  app.innerHTML = `${header()}<main class="container"><section class="card"><h1 class="h1">Pilih Paket Try Out</h1><p class="lead">Paket A, B, dan C masing-masing 100 soal dengan komposisi sesuai gambar ujian. Setelah selesai, hasil otomatis tersimpan ke database Supabase.</p><div class="grid">${cards}</div></section></main>`;
  bindHeader();
}

function setupQuiz(paket) {
  state.paket = paket;
  state.questions = state.bankSoal.filter(q=>q.paket===paket).sort((a,b)=>a.nomor-b.nomor);
  const storageKey = `pbj_attempt_${paket}`;
  const saved = localStorage.getItem(storageKey);
  state.current = 0; state.answers = {}; state.doubtful = {}; state.result = null; state.error = ''; state.remaining = DURATION_SECONDS;
  if (saved) { try { const d = JSON.parse(saved); state.current = d.current || 0; state.answers = d.answers || {}; state.doubtful = d.doubtful || {}; state.startedAt = d.startedAt || new Date().toISOString(); } catch { state.startedAt = new Date().toISOString(); } } else { state.startedAt = new Date().toISOString(); }
}
function saveQuiz() { if (!state.startedAt || state.result || !state.paket) return; localStorage.setItem(`pbj_attempt_${state.paket}`, JSON.stringify({ current: state.current, answers: state.answers, doubtful: state.doubtful, startedAt: state.startedAt })); }
function startTimer() { if (state.timer) clearInterval(state.timer); const tick = () => { if (state.result) return; const elapsed = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000); state.remaining = Math.max(0, DURATION_SECONDS - elapsed); const el = document.getElementById('timer'); if (el) el.textContent = formatTime(state.remaining); if (state.remaining <= 0) finishQuiz(true); }; tick(); state.timer = setInterval(tick, 1000); }
function calculateResult(autoFinished=false) { let correctCount=0, wrongCount=0, emptyCount=0; const answerDetails = state.questions.map(item=>{ const selected = state.answers[item.id] || null; const isCorrect = selected === item.jawaban; if (!selected) emptyCount++; else if (isCorrect) correctCount++; else wrongCount++; return { questionId:item.id, nomor:item.nomor, questionText:item.pertanyaan, options:item.pilihan, selectedAnswer:selected, correctAnswer:item.jawaban, isCorrect, isDoubtful:Boolean(state.doubtful[item.id]), materi:item.materi, tag:item.tag, pembahasan:item.pembahasan, referensi:item.referensi }; }); const score = Math.round((correctCount / state.questions.length) * 100); const finishedAt = new Date().toISOString(); const durationSeconds = Math.max(0, Math.floor((new Date(finishedAt).getTime() - new Date(state.startedAt).getTime()) / 1000)); return { username:state.username, paket:state.paket, score, totalQuestions:state.questions.length, correctCount, wrongCount, emptyCount, doubtfulCount:Object.values(state.doubtful).filter(Boolean).length, isPassed:score>=65, startedAt:state.startedAt, finishedAt, durationSeconds, answers:answerDetails, autoFinished }; }
async function finishQuiz(autoFinished=false) { if (state.submitting || state.result) return; const empty = state.questions.length - Object.keys(state.answers).length; if (!autoFinished && empty > 0 && !confirm(`Masih ada ${empty} soal kosong. Yakin selesai?`)) return; const finalResult = calculateResult(autoFinished); state.submitting = true; state.error=''; renderQuiz(); try { const res = await fetch('/api/attempts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(finalResult) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hasil.'); localStorage.removeItem(`pbj_attempt_${state.paket}`); state.result = {...finalResult, attemptId:data.attemptId}; } catch (err) { state.error = err.message; state.result = finalResult; } finally { state.submitting = false; renderResult(); } }

function renderQuiz() {
  if (!state.username) { location.hash=''; return renderUsernameGate(); }
  if (!state.questions.length) { app.innerHTML = `${header('Paket tidak ditemukan')}<main class="container"><div class="card error">Paket soal tidak ditemukan.</div></main>`; bindHeader(); return; }
  const q = state.questions[state.current];
  app.innerHTML = `${header(state.paket, `User: <b>${esc(state.username)}</b>`)}<main class="container"><div class="quiz-layout"><section class="card">${state.error ? `<div class="error" style="margin-bottom:14px">${esc(state.error)}</div>`:''}<div class="meta"><span class="badge">Soal ${state.current+1} dari ${state.questions.length}</span><span class="badge">${esc(q.materi)}</span><span class="badge">${esc(q.tag)}</span></div><h1 class="question-title">${esc(q.pertanyaan)}</h1>${['A','B','C','D'].map(k=>`<button class="option ${state.answers[q.id]===k?'active':''}" data-answer="${k}"><span class="option-key">${k}</span><span>${esc(q.pilihan[k])}</span></button>`).join('')}<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button class="btn secondary" id="prevBtn" ${state.current===0?'disabled':''}>Sebelumnya</button><button class="btn secondary" id="doubtBtn">${state.doubtful[q.id]?'Batal Ragu-ragu':'Tandai Ragu-ragu'}</button><button class="btn" id="nextBtn" ${state.current===state.questions.length-1?'disabled':''}>Selanjutnya</button><button class="btn green" id="finishBtn" ${state.submitting?'disabled':''}>${state.submitting?'Menyimpan...':'Selesai & Simpan'}</button></div></section><aside class="card sidebar"><div>Waktu tersisa</div><div class="timer" id="timer">${formatTime(state.remaining)}</div><div class="meta"><span class="badge">Terjawab ${Object.keys(state.answers).length}</span><span class="badge">Kosong ${state.questions.length - Object.keys(state.answers).length}</span></div><div class="number-grid">${state.questions.map((item,idx)=>`<button class="num ${idx===state.current?'current':''} ${state.answers[item.id]?'answered':''} ${state.doubtful[item.id]?'doubtful':''}" data-num="${idx}">${idx+1}</button>`).join('')}</div></aside></div></main>`;
  bindHeader();
  document.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>{ state.answers[q.id] = btn.dataset.answer; saveQuiz(); renderQuiz(); });
  document.getElementById('prevBtn').onclick = () => { state.current = Math.max(0,state.current-1); saveQuiz(); renderQuiz(); };
  document.getElementById('nextBtn').onclick = () => { state.current = Math.min(state.questions.length-1,state.current+1); saveQuiz(); renderQuiz(); };
  document.getElementById('doubtBtn').onclick = () => { state.doubtful[q.id] = !state.doubtful[q.id]; saveQuiz(); renderQuiz(); };
  document.getElementById('finishBtn').onclick = () => finishQuiz(false);
  document.querySelectorAll('[data-num]').forEach(btn=>btn.onclick=()=>{ state.current = Number(btn.dataset.num); saveQuiz(); renderQuiz(); });
  startTimer();
}
function renderResult() { const result = state.result; const wrongAnswers = result.answers.filter(a=>!a.isCorrect); app.innerHTML = `${header(`${state.paket} - Hasil`, `User: <b>${esc(state.username)}</b>`)}<main class="container"><div class="card">${state.error ? `<div class="error" style="margin-bottom:14px">Hasil tampil, tetapi gagal tersimpan ke database: ${esc(state.error)}</div>` : `<div class="success" style="margin-bottom:14px">Hasil sudah tersimpan ke database.</div>`}<h1 class="h1">Hasil Try Out</h1><div class="result-score">${result.score}</div><p class="lead">Status: <b style="color:${result.isPassed?'var(--green)':'var(--red)'}">${result.isPassed?'Lulus':'Tidak Lulus'}</b></p><div class="meta"><span class="badge">Benar: ${result.correctCount}</span><span class="badge">Salah: ${result.wrongCount}</span><span class="badge">Kosong: ${result.emptyCount}</span><span class="badge">Ragu-ragu: ${result.doubtfulCount}</span><span class="badge">Durasi: ${formatDuration(result.durationSeconds)}</span></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><a class="btn" href="#">Kembali ke Dashboard</a><button class="btn secondary" id="retryBtn">Ulangi Paket Ini</button></div></div><div class="card" style="margin-top:18px"><h2 style="margin-top:0">Pembahasan Soal Salah/Kosong</h2>${wrongAnswers.length===0 ? `<p class="success">Semua jawaban benar.</p>` : wrongAnswers.map(item=>`<div class="detail"><b>No. ${item.nomor} — ${esc(item.materi)}</b><p>${esc(item.questionText)}</p><p>Jawaban Anda: <b>${esc(item.selectedAnswer || 'Kosong')}</b> | Jawaban benar: <b>${esc(item.correctAnswer)}</b></p><p><b>Pembahasan:</b> ${esc(item.pembahasan)}</p></div>`).join('')}</div></main>`; bindHeader(); document.getElementById('retryBtn').onclick = () => { localStorage.removeItem(`pbj_attempt_${state.paket}`); setupQuiz(state.paket); renderQuiz(); }; }

function render() { const route = getRoute(); state.username = localStorage.getItem('pbj_username') || ''; if (route.page === 'quiz') { if (route.paket !== state.paket || !state.questions.length || state.result) setupQuiz(route.paket); return renderQuiz(); } renderHome(); }
window.addEventListener('hashchange', render);
loadBank().then(render).catch(err=>{ app.innerHTML = `<main class="container"><div class="card error">Gagal memuat bank soal: ${esc(err.message)}</div></main>`; });
