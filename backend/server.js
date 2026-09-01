const http = require('http');
const crypto = require('crypto');
const { db, find, insert, update } = require('./db');
const { hashPassword, verifyPassword, newSessionToken } = require('./auth');

const PORT = Number(process.env.PORT || 3000);
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const MAKE_CALLBACK_SECRET = process.env.MAKE_CALLBACK_SECRET || '';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(payload);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1024 * 1024) req.destroy(); });
    req.on('end', () => { if (!raw) return resolve({}); try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function newId(prefix) { return `${prefix}_${crypto.randomBytes(10).toString('hex')}`; }
function safeUser(user) { return user ? { id: user.id, email: user.email, display_name: user.display_name } : null; }
function bearer(req) { const value = req.headers.authorization || ''; return value.startsWith('Bearer ') ? value.slice(7) : null; }
function currentUser(req) {
  const token = bearer(req); if (!token) return null;
  const session = find('sessions', s => s.token === token && new Date(s.expires_at).getTime() > Date.now());
  return session ? find('users', u => u.id === session.user_id) : null;
}
function currentClient(user) {
  if (!user) return null;
  const membership = find('memberships', m => m.user_id === user.id);
  return membership ? find('clients', c => c.id === membership.client_id) : null;
}
function createSession(userId) {
  const token = newSessionToken();
  insert('sessions', { id: newId('ses'), token, user_id: userId, expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString() });
  return token;
}
async function sendToMake(job) {
  if (!MAKE_WEBHOOK_URL) return { sent: false, reason: 'MAKE_WEBHOOK_URL not configured' };
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      event: 'publishing.job.created', job_id: job.id, client_id: job.client_id, source_file_url: job.source_file_url,
      title: job.title, description: job.description, targets: job.targets,
      callback_url: `${process.env.APP_BASE_URL || `http://localhost:${PORT}`}/api/make/callback`
    }), signal: controller.signal });
    return { sent: response.ok, status: response.status };
  } finally { clearTimeout(timer); }
}
async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); const path = url.pathname;
  if (req.method === 'GET' && path === '/api/health') return json(res, 200, { ok: true, service: 'client-social-saas-api' });

  if (req.method === 'POST' && path === '/api/auth/signup') {
    let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
    const displayName = String(body.display_name || '').trim(); const clientName = String(body.client_name || `${displayName || 'My'} Workspace`).trim();
    if (!email || !email.includes('@')) return json(res, 400, { error: 'valid_email_required' });
    if (password.length < 8) return json(res, 400, { error: 'password_min_8_characters' });
    if (find('users', u => u.email === email)) return json(res, 409, { error: 'email_already_exists' });
    const user = insert('users', { id: newId('usr'), email, display_name: displayName, password_hash: hashPassword(password), created_at: new Date().toISOString() });
    const client = insert('clients', { id: newId('cli'), name: clientName, owner_user_id: user.id, status: 'active', created_at: new Date().toISOString() });
    insert('memberships', { id: newId('mem'), client_id: client.id, user_id: user.id, role: 'owner' });
    insert('subscriptions', { id: newId('sub'), client_id: client.id, plan_id: 'free', status: 'active' });
    return json(res, 201, { user: safeUser(user), client, access_token: createSession(user.id) });
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
    const user = find('users', u => u.email === email);
    if (!user || !verifyPassword(password, user.password_hash)) return json(res, 401, { error: 'invalid_credentials' });
    return json(res, 200, { user: safeUser(user), client: currentClient(user), access_token: createSession(user.id) });
  }

  if (req.method === 'POST' && path === '/api/auth/logout') {
    const token = bearer(req); if (token) { const session = find('sessions', s => s.token === token); if (session) update('sessions', s => s.id === session.id, s => { s.expires_at = new Date(0).toISOString(); }); }
    return json(res, 200, { ok: true });
  }

  const user = currentUser(req);
  if (req.method === 'GET' && path === '/api/auth/me') {
    if (!user) return json(res, 401, { error: 'authentication_required' });
    return json(res, 200, { user: safeUser(user), client: currentClient(user) });
  }
  if (!user) return json(res, 401, { error: 'authentication_required' });
  const client = currentClient(user); if (!client) return json(res, 403, { error: 'client_membership_required' });

  if (req.method === 'GET' && path === '/api/client') return json(res, 200, { client });
  if (req.method === 'PATCH' && path === '/api/client') {
    let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    if (typeof body.name === 'string' && body.name.trim()) client.name = body.name.trim();
    if (body.status === 'active' || body.status === 'paused') client.status = body.status;
    update('clients', c => c.id === client.id, c => Object.assign(c, client));
    return json(res, 200, { client });
  }
  if (req.method === 'GET' && path === '/api/connections') return json(res, 200, { connections: ['youtube', 'instagram'].map(provider => ({ provider, status: 'disconnected' })) });
  if (req.method === 'GET' && path === '/api/jobs') return json(res, 200, { jobs: db.jobs.filter(j => j.client_id === client.id).sort((a,b) => b.requested_at.localeCompare(a.requested_at)) });

  if (req.method === 'POST' && path === '/api/jobs') {
    let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const source = String(body.source_file_url || '').trim();
    const targets = Array.isArray(body.targets) ? body.targets.filter(t => t === 'youtube' || t === 'instagram') : ['youtube', 'instagram'];
    if (!source) return json(res, 400, { error: 'source_file_url_required' }); if (!targets.length) return json(res, 400, { error: 'at_least_one_target_required' });
    const planSub = find('subscriptions', s => s.client_id === client.id && s.status === 'active'); const plan = planSub && find('plans', p => p.id === planSub.plan_id);
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0,0,0,0);
    const monthJobs = db.jobs.filter(j => j.client_id === client.id && new Date(j.requested_at) >= monthStart).length;
    if (plan && monthJobs >= plan.monthly_job_limit) return json(res, 429, { error: 'monthly_job_limit_reached', limit: plan.monthly_job_limit });
    const job = insert('jobs', { id: newId('job'), client_id: client.id, source_file_url: source, title: String(body.title || ''), description: String(body.description || ''), targets, status: 'queued', requested_at: new Date().toISOString(), started_at: null, completed_at: null, error_message: null });
    try { job.make = await sendToMake(job); } catch { job.make = { sent: false, reason: 'make_request_failed' }; }
    return json(res, 201, { job });
  }

  if (req.method === 'POST' && path === '/api/make/callback') {
    if (!MAKE_CALLBACK_SECRET || req.headers['x-make-secret'] !== MAKE_CALLBACK_SECRET) return json(res, 401, { error: 'invalid_callback_auth' });
    let body; try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const job = find('jobs', j => j.id === body.job_id); if (!job) return json(res, 404, { error: 'job_not_found' }); if (body.client_id !== job.client_id) return json(res, 403, { error: 'client_mismatch' });
    if (['queued','processing','published','failed'].includes(body.status)) job.status = body.status;
    if (body.error_message) job.error_message = String(body.error_message);
    if (job.status === 'processing') job.started_at = job.started_at || new Date().toISOString();
    if (job.status === 'published' || job.status === 'failed') job.completed_at = job.completed_at || new Date().toISOString();
    job.results = Array.isArray(body.results) ? body.results : job.results || [];
    return json(res, 200, { ok: true, job_id: job.id, status: job.status });
  }
  return json(res, 404, { error: 'not_found' });
}
const server = http.createServer((req, res) => router(req, res).catch(() => json(res, 500, { error: 'internal_server_error' })));
server.listen(PORT, () => console.log(`Client Social SaaS API listening on ${PORT}`));
