const API_BASE = window.CLIENT_SOCIAL_API || "";
const tokenKey = "client_social_access_token";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const token = () => localStorage.getItem(tokenKey);
const state = { jobs: [], connections: [], user: null, client: null, status: "all", query: "" };

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (token()) headers.authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function statusClass(status) { return status === "published" ? "status-success" : status === "failed" ? "status-failed" : "status-queued"; }
function titleCase(value) { return String(value || "").replace(/\b\w/g, (m) => m.toUpperCase()); }
function routeName() { return (location.hash.replace(/^#/, "") || "dashboard").split("?")[0]; }

function showAuth() {
  $("#auth").hidden = false;
  $("#portal").hidden = true;
}
function showPortal() {
  $("#auth").hidden = true;
  $("#portal").hidden = false;
  route();
  loadDashboard();
}
function switchAuth(mode) {
  const login = mode === "login";
  $("#login-tab").classList.toggle("active", login);
  $("#signup-tab").classList.toggle("active", !login);
  $("#login-form").hidden = !login;
  $("#signup-form").hidden = login;
  $("#auth-message").textContent = "";
}

function route() {
  if (!token()) return showAuth();
  const requested = routeName();
  const view = $("[data-view='" + requested + "']") ? requested : "dashboard";
  $$(".view").forEach((section) => { section.hidden = section.dataset.view !== view; });
  $$(".side-nav a[data-route]").forEach((link) => link.classList.toggle("active", link.dataset.route === view));
  const labels = { dashboard: "Dashboard", create: "Create Content", library: "Content Library", schedule: "Publish & Schedule", analytics: "Analytics", studio: "AI Studio", accounts: "Social Accounts", team: "Team", settings: "Settings" };
  const label = labels[view] || "Dashboard";
  $("#topbar-section").textContent = label;
  $("#mobile-section").textContent = label;
  document.title = `${label} · ContentFlow`;
  if (view === "library") renderLibrary();
  if (view === "schedule") renderSchedule();
  if (view === "analytics") renderAnalytics();
  $(".sidebar")?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderActivity() {
  const jobs = state.jobs.slice(0, 4);
  $("#activity-list").innerHTML = jobs.length ? jobs.map((job) => `<div class="activity-row"><span class="activity-icon">✦</span><div><b>${escapeHtml(job.title || "Untitled video")}</b><small>${escapeHtml(job.status)} · ${escapeHtml((job.targets || []).join(" + "))}</small></div><span class="pill ${statusClass(job.status)}">${escapeHtml(job.status)}</span></div>`).join("") : `<div class="empty-row">Create your first piece of content to see activity here.</div>`;
}
function renderLibrary() {
  const query = state.query.toLowerCase();
  const filtered = state.jobs.filter((job) => {
    const statusOk = state.status === "all" || job.status === state.status;
    const queryOk = !query || `${job.title || ""} ${job.source_file_url || ""}`.toLowerCase().includes(query);
    return statusOk && queryOk;
  });
  const list = $("#job-list");
  list.innerHTML = filtered.length ? filtered.map((job) => `<div class="content-row"><div class="content-title"><span class="content-thumb">▶</span><div><b>${escapeHtml(job.title || "Untitled video")}</b><small>${escapeHtml(job.source_file_url || "")}</small></div></div><span class="pill ${statusClass(job.status)}">${escapeHtml(job.status)}</span><span class="targets">${escapeHtml((job.targets || []).join(" · ") || "—")}</span><a class="detail-link" href="#schedule">View</a></div>`).join("") : `<div class="empty-state"><strong>No matching content.</strong><p>Try another status or search term.</p><a class="button ghost" href="#create">Create content</a></div>`;
}
function renderSchedule() {
  const counts = { queued: 0, processing: 0, published: 0, failed: 0 };
  state.jobs.forEach((job) => { if (counts[job.status] !== undefined) counts[job.status] += 1; });
  $("#schedule-queued").textContent = counts.queued;
  $("#schedule-processing").textContent = counts.processing;
  $("#schedule-published").textContent = counts.published;
  $("#schedule-failed").textContent = counts.failed;
  $("#schedule-list").innerHTML = state.jobs.length ? state.jobs.map((job, index) => `<div class="timeline-item"><span class="timeline-time">${index === 0 ? "Latest" : `Job ${index + 1}`}</span><div><b>${escapeHtml(job.title || "Untitled video")}</b><small>${escapeHtml((job.targets || []).join(" · ") || "No targets")}</small></div><span class="pill ${statusClass(job.status)}">${escapeHtml(job.status)}</span></div>`).join("") : `<div class="empty-state"><strong>No publishing jobs yet.</strong><p>Create content to populate the queue.</p></div>`;
}
function renderAnalytics() {
  const total = state.jobs.length;
  const published = state.jobs.filter((j) => j.status === "published").length;
  const failed = state.jobs.filter((j) => j.status === "failed").length;
  $("#analytics-jobs").textContent = total;
  $("#analytics-published").textContent = published;
  $("#analytics-success").textContent = total ? `${Math.round((published / total) * 100)}%` : "—";
  const buckets = ["draft", "queued", "processing", "published", "failed"].map((status) => ({ status, count: state.jobs.filter((j) => j.status === status).length }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  $("#analytics-bars").innerHTML = buckets.map((b) => `<div class="bar-row"><span>${titleCase(b.status)}</span><div class="bar-track"><div class="bar-fill" style="width:${(b.count / max) * 100}%"></div></div><b>${b.count}</b></div>`).join("");
}
function renderDashboardMetrics() {
  const counts = { draft: 0, queued: 0, processing: 0, published: 0, failed: 0 };
  state.jobs.forEach((job) => { if (counts[job.status] !== undefined) counts[job.status] += 1; });
  $("#published-count").textContent = counts.published;
  ["draft", "queued", "processing", "published", "failed"].forEach((key) => { const bar = $(`#bar-${key}`); if (bar) bar.style.height = `${Math.max(12, counts[key] * 18 + 12)}%`; });
  renderActivity();
}
function renderConnections() {
  state.connections.forEach((connection) => {
    const card = $(`[data-provider="${connection.provider}"]`);
    const pill = card?.querySelector(".pill");
    if (!pill) return;
    const connected = connection.status === "connected";
    pill.textContent = connected ? "Connected" : "Not connected";
    pill.className = `pill ${connected ? "status-success" : ""}`;
  });
}
function populateWorkspace() {
  const name = (state.user?.display_name || state.client?.name || "Creator").split(" ")[0] || "Creator";
  const workspace = state.client?.name || "Creator Studio";
  const initial = name[0].toUpperCase();
  $("#dashboard-name").textContent = name;
  $("#workspace-name").textContent = workspace;
  $("#topbar-workspace").textContent = workspace;
  $("#workspace-avatar").textContent = initial;
  $("#avatar-letter").textContent = initial;
  $("#profile-avatar").textContent = initial;
  $("#profile-name").textContent = state.user?.display_name || name;
  $("#settings-name").value = workspace;
}

async function loadDashboard() {
  if (!token()) return;
  try {
    const [{ jobs }, { connections }, { user, client }] = await Promise.all([api("/api/jobs"), api("/api/connections"), api("/api/auth/me")]);
    state.jobs = Array.isArray(jobs) ? jobs : [];
    state.connections = Array.isArray(connections) ? connections : [];
    state.user = user;
    state.client = client;
    populateWorkspace();
    renderDashboardMetrics();
    renderConnections();
    renderLibrary();
    renderSchedule();
    renderAnalytics();
  } catch (error) { console.warn(error.message); }
}

function generateDraft(topic, platform, tone, points) {
  const cleanTopic = topic.trim();
  const cleanPoints = points.trim() || "Focus on the most useful takeaway and one concrete next step.";
  const title = platform === "YouTube" ? `${cleanTopic} — what creators should know` : `${cleanTopic} — save this for later`;
  const caption = tone === "Professional" ? `A practical take on ${cleanTopic}. ${cleanPoints}` : `Let’s make ${cleanTopic} simpler. ${cleanPoints} What would you add?`;
  const description = `ContentFlow draft for ${platform}. Topic: ${cleanTopic}. Tone: ${tone}. ${cleanPoints}`;
  return { title, caption, description };
}

function wire() {
  $("#login-tab")?.addEventListener("click", () => switchAuth("login"));
  $("#signup-tab")?.addEventListener("click", () => switchAuth("signup"));
  $("#login-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); localStorage.setItem(tokenKey, result.access_token); showPortal(); } catch (error) { $("#auth-message").textContent = error.message; } });
  $("#signup-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { const result = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); localStorage.setItem(tokenKey, result.access_token); showPortal(); } catch (error) { $("#auth-message").textContent = error.message; } });

  const doLogout = async () => { try { await api("/api/auth/logout", { method: "POST" }); } catch {} localStorage.removeItem(tokenKey); showAuth(); window.location.hash = ""; window.scrollTo({ top: 0 }); };
  $("#logout")?.addEventListener("click", doLogout);
  $("#settings-logout")?.addEventListener("click", doLogout);
  $("#profile-shortcut")?.addEventListener("click", () => { window.location.hash = "settings"; });
  $("#mobile-menu")?.addEventListener("click", () => $(".sidebar")?.classList.toggle("open"));
  window.addEventListener("hashchange", route);

  $("#job-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.targets = ["youtube", "instagram"].filter((platform) => data[platform] === "on");
    delete data.youtube; delete data.instagram;
    if (!data.targets.length) { $("#job-message").textContent = "Select at least one platform."; return; }
    try {
      await api("/api/jobs", { method: "POST", body: JSON.stringify(data) });
      form.reset();
      $("input[name=youtube]").checked = true;
      $("input[name=instagram]").checked = true;
      $$(".target").forEach((target) => target.classList.add("active"));
      $("#job-message").textContent = "Content engine launched — job queued successfully.";
      await loadDashboard();
      location.hash = "library";
    } catch (error) { $("#job-message").textContent = error.message; }
  });

  $$(".target").forEach((target) => target.addEventListener("click", () => { const checkbox = target.querySelector("input"); setTimeout(() => target.classList.toggle("active", checkbox.checked), 0); }));
  $$(".filter-tabs button").forEach((button) => button.addEventListener("click", () => { $$(".filter-tabs button").forEach((b) => b.classList.remove("active")); button.classList.add("active"); state.status = button.dataset.status; renderLibrary(); }));
  $("#library-search")?.addEventListener("input", (event) => { state.query = event.target.value; renderLibrary(); });
  $("#global-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") { state.query = event.target.value; location.hash = "library"; renderLibrary(); } });
  $("#optimize-content")?.addEventListener("click", () => { const topic = $("input[name=title]").value || $("#content-niche").value; $("#ai-brief").textContent = topic ? `AI brief prepared: lead with a clear hook around “${topic}”, keep the voice ${$("#content-tone").value.toLowerCase()}, and adapt the final copy per platform.` : "Add a title or niche first so the brief has useful context."; });
  $("#studio-form")?.addEventListener("submit", (event) => { event.preventDefault(); const draft = generateDraft($("#studio-topic").value, $("#studio-platform").value, $("#studio-tone").value, $("#studio-points").value); $("#studio-output").innerHTML = `<div class="copy-card"><label>Title</label><p>${escapeHtml(draft.title)}</p></div><div class="copy-card"><label>Description</label><p>${escapeHtml(draft.description)}</p></div><div class="copy-card"><label>Caption</label><p>${escapeHtml(draft.caption)}</p></div>`; });
  $("#settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { const result = await api("/api/client", { method: "PATCH", body: JSON.stringify({ name: $("#settings-name").value.trim() }) }); state.client = result.client; populateWorkspace(); $("#settings-message").textContent = `Saved ${result.client.name}.`; } catch (error) { $("#settings-message").textContent = error.message; } });
}

async function bootstrap() {
  wire();
  if (!token()) return showAuth();
  try { await api("/api/auth/me"); showPortal(); } catch { localStorage.removeItem(tokenKey); showAuth(); }
}
bootstrap();
