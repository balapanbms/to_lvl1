const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel Environment Variables.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function checkAdminPin(req) {
  const adminPin = process.env.ADMIN_PIN;
  const requestPin = req.headers['x-admin-pin'];
  return Boolean(adminPin && requestPin && String(requestPin) === String(adminPin));
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Body JSON tidak valid.'));
      }
    });
    req.on('error', reject);
  });
}

module.exports = { getSupabaseAdmin, checkAdminPin, sendJson, readJson };
