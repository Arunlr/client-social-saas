const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const MAKE_CALLBACK_SECRET = process.env.MAKE_CALLBACK_SECRET || '';

// Dependency-free API foundation. Persistence/auth provider can be swapped in later.
const state = {
  users: new Map(),
  clients: new Map(),
  memberships: new Map(),
  jobs: new Map(),
};

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
}

function safeUser(user) {
  return user ? { id: user.id, email: user.email, display_name: user.display_name } : null;
}

function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : null;
}

function currentUser(req) {
  const token = bearer(req);
  if (!token) return null;
  const userId = token.replace(/^demo-/, '');
  return state.users.get(userId) || null;
}

function currentClient(user) {
  if (!user) return null;
  const membership = [...state.memberships.values()].find(m => m.user_id === user.id);
  return membership ? state.clients.get(membership.client_id) : null;
}

async function sendToMake(job) {
  if (!MAKE_WEBHOOK_URL) return { sent: false, reason: 'MAKE_WEBHOOK_URL not configured' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'publishing.job.created',
        job_id: job.id,
        client_id: job.client_id,
        source_file_url: job.source_file_url,
        title: job.title,
        description: job.description,
        targets: job.targets,
        callback_url: `${process.env.APP_BASE_URL || `http://localhost:${PORT}`}/api/make/callback`,
      }),
      signal: controller.signal,
    });
    return { sent: response.ok, status: response.status };
  } finally { clearTimeout(timer); }
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/health') return json(res, 200, { ok: true, service: 'client-social-saas-api' });

  if (req.method === 'POST' && path === '/api/auth/signup') {
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const email = String(body.email || '').trim().toLowerCase();
    const displayName = String(body.display_name || '').trim();
    const clientName = String(body.client_name || `${displayName || 'My'} Workspace`).trim();
    if (!email || !email.includes('@')) return json(res, 400, { error: 'valid_email_required' });
    if ([...state.users.values()].some(u => u.email === email)) return json(res, 409, { error: 'email_already_exists' });

    const user = { id: newId('usr'), email, display_name: displayName };
    const client = { id: newId('cli'), name: clientName, owner_user_id: user.id, status: 'active', created_at: new Date().toISOString() };
    state.users.set(user.id, user);
    state.clients.set(client.id, client);
    state.memberships.set(newId('mem'), { client_id: client.id, user_id: user.id, role: 'owner' });
    return json(res, 201, { user: safeUser(user), client, access_token: `demo-${user.id}` });
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const email = String(body.email || '').trim().toLowerCase();
    const user = [...state.users.values()].find(u => u.email === email);
    if (!user) return json(res, 401, { error: 'invalid_credentials' });
    return json(res, 200, { user: safeUser(user), client: currentClient(user), access_token: `demo-${user.id}` });
  }

  const user = currentUser(req);
  if (req.method === 'GET' && path === '/api/auth/me') {
    if (!user) return json(res, 401, { error: 'authentication_required' });
    return json(res, 200, { user: safeUser(user), client: currentClient(user) });
  }

  if (!user) return json(res, 401, { error: 'authentication_required' });
  const client = currentClient(user);
  if (!client) return json(res, 403, { error: 'client_membership_required' });

  if (req.method === 'GET' && path === '/api/client') return json(res, 200, { client });

  if (req.method === 'PATCH' && path === '/api/client') {
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    if (typeof body.name === 'string' && body.name.trim()) client.name = body.name.trim();
    if (body.status === 'active' || body.status === 'paused') client.status = body.status;
    return json(res, 200, { client });
  }

  if (req.method === 'GET' && path === '/api/connections') return json(res, 200, { connections: ['youtube', 'instagram'].map(provider => ({ provider, status: 'disconnected' })) });

  if (req.method === 'GET' && path === '/api/jobs') {
    const jobs = [...state.jobs.values()].filter(j => j.client_id === client.id).sort((a,b) => b.requested_at.localeCompare(a.requested_at));
    return json(res, 200, { jobs });
  }

  if (req.method === 'POST' && path === '/api/jobs') {
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const source = String(body.source_file_url || '').trim();
    const targets = Array.isArray(body.targets) ? body.targets.filter(t => t === 'youtube' || t === 'instagram') : ['youtube', 'instagram'];
    if (!source) return json(res, 400, { error: 'source_file_url_required' });
    if (!targets.length) return json(res, 400, { error: 'at_least_one_target_required' });
    const job = { id: newId('job'), client_id: client.id, source_file_url: source, title: String(body.title || ''), description: String(body.description || ''), targets, status: 'queued', requested_at: new Date().toISOString(), started_at: null, completed_at: null, error_message: null };
    state.jobs.set(job.id, job);
    try { job.make = await sendToMake(job); } catch { job.make = { sent: false, reason: 'make_request_failed' }; }
    return json(res, 201, { job });
  }

  if (req.method === 'POST' && path === '/api/make/callback') {
    if (!MAKE_CALLBACK_SECRET || req.headers['x-make-secret'] !== MAKE_CALLBACK_SECRET) return json(res, 401, { error: 'invalid_callback_auth' });
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'invalid_json' }); }
    const job = state.jobs.get(body.job_id);
    if (!job) return json(res, 404, { error: 'job_not_found' });
    if (body.client_id !== job.client_id) return json(res, 403, { error: 'client_mismatch' });
    if (['queued', 'processing', 'published', 'failed'].includes(body.status)) job.status = body.status;
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
