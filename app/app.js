const API_BASE = window.CLIENT_SOCIAL_API || '';
const tokenKey = 'client_social_access_token';

const $ = (selector) => document.querySelector(selector);
const token = () => localStorage.getItem(tokenKey);

async function api(path, options = {}) {
  const headers = { 'content-type': 'application/json', ...(options.headers || {}) };
  if (token()) headers.authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function renderJobs(jobs) {
  const list = $('#job-list');
  if (!list) return;
  if (!jobs.length) { list.innerHTML = '<div class="empty"><strong>No publishing jobs yet</strong><p>Create your first job to see its progress here.</p></div>'; return; }
  list.innerHTML = jobs.map(job => `<div class="job"><div><strong>${escapeHtml(job.title || 'Untitled')}</strong><small>${escapeHtml(job.source_file_url)}</small></div><span class="pill">${escapeHtml(job.status)}</span></div>`).join('');
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function loadDashboard() {
  if (!token()) return;
  try {
    const [{ jobs }, { connections }] = await Promise.all([api('/api/jobs'), api('/api/connections')]);
    renderJobs(jobs);
    const queued = jobs.filter(j => j.status === 'queued' || j.status === 'processing').length;
    const published = jobs.filter(j => j.status === 'published').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    $('#queued-count').textContent = queued;
    $('#published-count').textContent = published;
    $('#failed-count').textContent = failed;
    connections.forEach(connection => {
      const node = document.querySelector(`[data-provider="${connection.provider}"] .pill`);
      if (node) node.textContent = connection.status === 'connected' ? 'Connected' : 'Not connected';
    });
  } catch (error) { console.warn(error.message); }
}

function wireForms() {
  const signup = $('#signup-form');
  signup?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(signup));
    try { const result = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }); localStorage.setItem(tokenKey, result.access_token); location.reload(); }
    catch (error) { $('#auth-message').textContent = error.message; }
  });

  const login = $('#login-form');
  login?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(login));
    try { const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }); localStorage.setItem(tokenKey, result.access_token); location.reload(); }
    catch (error) { $('#auth-message').textContent = error.message; }
  });

  const job = $('#job-form');
  job?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(job));
    data.targets = ['youtube', 'instagram'].filter(provider => data[provider] === 'on');
    delete data.youtube; delete data.instagram;
    try { await api('/api/jobs', { method: 'POST', body: JSON.stringify(data) }); job.reset(); await loadDashboard(); $('#job-message').textContent = 'Job queued successfully.'; }
    catch (error) { $('#job-message').textContent = error.message; }
  });
}

wireForms();
loadDashboard();
