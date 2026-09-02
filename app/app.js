const API_BASE = window.CLIENT_SOCIAL_API || "";
const tokenKey = "client_social_access_token";

const $ = (selector) => document.querySelector(selector);
const token = () => localStorage.getItem(tokenKey);

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (token()) headers.authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showPortal() {
  $("#auth").hidden = true;
  $("#portal").hidden = false;
  $("#logout").hidden = false;
  loadDashboard();
}
function showAuth() {
  $("#auth").hidden = false;
  $("#portal").hidden = true;
  $("#logout").hidden = true;
}
function renderJobs(jobs) {
  const list = $("#job-list");
  if (!list) return;
  if (!jobs.length) {
    list.innerHTML = "<div class=\"empty\"><strong>No publishing jobs yet</strong><p>Create your first job to see its progress here.</p></div>";
    return;
  }
  list.innerHTML = jobs.map((job) => `<div class="job"><div><strong>${escapeHtml(job.title || "Untitled")}</strong><small>${escapeHtml(job.source_file_url)}</small></div><span class="pill">${escapeHtml(job.status)}</span></div>`).join("");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
async function loadDashboard() {
  if (!token()) return;
  try {
    const [{ jobs }, { connections }] = await Promise.all([api("/api/jobs"), api("/api/connections")]);
    renderJobs(jobs);
    $("#queued-count").textContent = jobs.filter((job) => job.status === "queued" || job.status === "processing").length;
    $("#published-count").textContent = jobs.filter((job) => job.status === "published").length;
    $("#failed-count").textContent = jobs.filter((job) => job.status === "failed").length;
    connections.forEach((connection) => {
      const node = document.querySelector(`[data-provider="${connection.provider}"] .pill`);
      if (node) node.textContent = connection.status === "connected" ? "Connected" : "Not connected";
    });
  } catch (error) {
    console.warn(error.message);
  }
}
function wireForms() {
  $("#login-tab")?.addEventListener("click", () => {
    $("#login-tab").classList.add("active"); $("#signup-tab").classList.remove("active");
    $("#login-form").hidden = false; $("#signup-form").hidden = true; $("#auth-message").textContent = "";
  });
  $("#signup-tab")?.addEventListener("click", () => {
    $("#signup-tab").classList.add("active"); $("#login-tab").classList.remove("active");
    $("#signup-form").hidden = false; $("#login-form").hidden = true; $("#auth-message").textContent = "";
  });
  $("#signup-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      localStorage.setItem(tokenKey, result.access_token);
      showPortal();
    } catch (error) { $("#auth-message").textContent = error.message; }
  });
  $("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      localStorage.setItem(tokenKey, result.access_token);
      showPortal();
    } catch (error) { $("#auth-message").textContent = error.message; }
  });
  $("#job-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.targets = ["youtube", "instagram"].filter((provider) => data[provider] === "on");
    delete data.youtube; delete data.instagram;
    try {
      await api("/api/jobs", { method: "POST", body: JSON.stringify(data) });
      form.reset(); await loadDashboard(); $("#job-message").textContent = "Job queued successfully.";
    } catch (error) { $("#job-message").textContent = error.message; }
  });
  $("#logout")?.addEventListener("click", async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* local logout still succeeds */ }
    localStorage.removeItem(tokenKey);
    showAuth();
  });
}
async function bootstrap() {
  wireForms();
  if (!token()) return showAuth();
  try { await api("/api/auth/me"); showPortal(); }
  catch { localStorage.removeItem(tokenKey); showAuth(); }
}
bootstrap();
