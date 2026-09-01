const encoder = new TextEncoder();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
function id(prefix) { return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`; }
function now() { return new Date().toISOString(); }
function hex(bytes) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function bytesFromHex(value) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
async function sha256(value) { return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
async function passwordHash(password, saltHex = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytesFromHex(saltHex), iterations: 100000 }, key, 256);
  return `v1:${saltHex}:${hex(bits)}`;
}
async function verifyPassword(password, stored) {
  const [version, salt, expected] = String(stored || "").split(":");
  if (version !== "v1" || !salt || !expected) return false;
  const actual = await passwordHash(password, salt);
  const actualHash = await sha256(actual);
  const expectedHash = await sha256(`v1:${salt}:${expected}`);
  let diff = actualHash.length ^ expectedHash.length;
  for (let i = 0; i < Math.min(actualHash.length, expectedHash.length); i += 1) diff |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return diff === 0;
}
async function sameSecret(actual, expected) {
  if (!actual || !expected) return false;
  const [a, b] = await Promise.all([sha256(actual), sha256(expected)]);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function safeUser(user) { return user ? { id: user.id, email: user.email, display_name: user.display_name } : null; }
function safeClient(client) { return client ? { id: client.id, name: client.name, status: client.status, created_at: client.created_at } : null; }
async function body(request) {
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 32768) throw new Error("payload_too_large");
  const text = await request.text();
  if (text.length > 32768) throw new Error("payload_too_large");
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new Error("invalid_json"); }
}
async function currentContext(request, env) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  const tokenHash = await sha256(value.slice(7));
  const row = await env.DB.prepare(`SELECT u.id, u.email, u.display_name, c.id AS client_id, c.name AS client_name, c.status AS client_status, c.created_at AS client_created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    JOIN memberships m ON m.user_id = u.id JOIN clients c ON c.id = m.client_id
    WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`).bind(tokenHash, now()).first();
  if (!row) return null;
  return {
    user: { id: row.id, email: row.email, display_name: row.display_name },
    client: { id: row.client_id, name: row.client_name, status: row.client_status, created_at: row.client_created_at }
  };
}
async function createSession(userId, env) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare("INSERT INTO sessions (id, token_hash, user_id, expires_at) VALUES (?, ?, ?, ?)")
    .bind(id("ses"), await sha256(token), userId, new Date(Date.now() + SESSION_TTL_MS).toISOString()).run();
  return token;
}
async function sendToMake(job, env) {
  if (!env.MAKE_WEBHOOK_URL) return { sent: false, reason: "MAKE_WEBHOOK_URL not configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(env.MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "publishing.job.created", job_id: job.id, client_id: job.client_id,
        source_file_url: job.source_file_url, title: job.title, description: job.description,
        targets: job.targets, callback_url: `${env.APP_BASE_URL || new URL(job.request_url).origin}/api/make/callback`
      }),
      signal: controller.signal
    });
    return { sent: response.ok, status: response.status };
  } finally { clearTimeout(timer); }
}
async function handleApi(request, env) {
  const url = new URL(request.url);
  const route = url.pathname;
  if (request.method === "GET" && route === "/api/health") {
    const plan = await env.DB.prepare("SELECT id FROM plans WHERE id = ?").bind("free").first();
    return json({ ok: Boolean(plan), service: "client-social-saas-api", persistence: "d1" });
  }
  if (request.method === "POST" && route === "/api/auth/signup") {
    let input; try { input = await body(request); } catch (error) { return json({ error: error.message }, error.message === "payload_too_large" ? 413 : 400); }
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const displayName = String(input.display_name || "").trim().slice(0, 120);
    const clientName = String(input.client_name || `${displayName || "My"} Workspace`).trim().slice(0, 160);
    if (!email || !email.includes("@") || email.length > 320) return json({ error: "valid_email_required" }, 400);
    if (password.length < 8 || password.length > 1024) return json({ error: "password_min_8_characters" }, 400);
    const userId = id("usr"), clientId = id("cli");
    try {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(userId, email, displayName, await passwordHash(password), now()),
        env.DB.prepare("INSERT INTO clients (id, name, owner_user_id, status, created_at) VALUES (?, ?, ?, 'active', ?)")
          .bind(clientId, clientName, userId, now()),
        env.DB.prepare("INSERT INTO memberships (id, client_id, user_id, role) VALUES (?, ?, ?, 'owner')")
          .bind(id("mem"), clientId, userId),
        env.DB.prepare("INSERT INTO subscriptions (id, client_id, plan_id, status) VALUES (?, ?, 'free', 'active')")
          .bind(id("sub"), clientId)
      ]);
    } catch (error) {
      if (String(error.message).toLowerCase().includes("unique")) return json({ error: "email_already_exists" }, 409);
      throw error;
    }
    return json({ user: { id: userId, email, display_name: displayName }, client: { id: clientId, name: clientName, status: "active" }, access_token: await createSession(userId, env) }, 201);
  }
  if (request.method === "POST" && route === "/api/auth/login") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const email = String(input.email || "").trim().toLowerCase();
    const user = await env.DB.prepare("SELECT id, email, display_name, password_hash FROM users WHERE email = ?").bind(email).first();
    if (!user || !(await verifyPassword(String(input.password || ""), user.password_hash))) return json({ error: "invalid_credentials" }, 401);
    const context = await env.DB.prepare("SELECT c.id, c.name, c.status, c.created_at FROM memberships m JOIN clients c ON c.id = m.client_id WHERE m.user_id = ? LIMIT 1").bind(user.id).first();
    return json({ user: safeUser(user), client: safeClient(context), access_token: await createSession(user.id, env) });
  }
  if (request.method === "POST" && route === "/api/auth/logout") {
    const value = request.headers.get("authorization") || "";
    if (value.startsWith("Bearer ")) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(value.slice(7))).run();
    return json({ ok: true });
  }
  if (request.method === "POST" && route === "/api/make/callback") {
    if (!(await sameSecret(request.headers.get("x-make-secret"), env.MAKE_CALLBACK_SECRET))) return json({ error: "invalid_callback_auth" }, 401);
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const job = await env.DB.prepare("SELECT id, client_id, status, started_at, completed_at FROM publishing_jobs WHERE id = ?").bind(String(input.job_id || "")).first();
    if (!job) return json({ error: "job_not_found" }, 404);
    if (input.client_id !== job.client_id) return json({ error: "client_mismatch" }, 403);
    const status = ["queued", "processing", "published", "failed"].includes(input.status) ? input.status : job.status;
    const timestamp = now();
    await env.DB.prepare("UPDATE publishing_jobs SET status = ?, error_message = ?, started_at = CASE WHEN ? = 'processing' AND started_at IS NULL THEN ? ELSE started_at END, completed_at = CASE WHEN ? IN ('published','failed') AND completed_at IS NULL THEN ? ELSE completed_at END WHERE id = ?")
      .bind(status, input.error_message ? String(input.error_message).slice(0, 1000) : null, status, timestamp, status, timestamp, job.id).run();
    return json({ ok: true, job_id: job.id, status });
  }
  const context = await currentContext(request, env);
  if (!context) return json({ error: "authentication_required" }, 401);
  if (request.method === "GET" && route === "/api/auth/me") return json({ user: safeUser(context.user), client: safeClient(context.client) });
  if (request.method === "GET" && route === "/api/client") return json({ client: safeClient(context.client) });
  if (request.method === "PATCH" && route === "/api/client") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const name = typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 160) : context.client.name;
    const status = ["active", "paused"].includes(input.status) ? input.status : context.client.status;
    await env.DB.prepare("UPDATE clients SET name = ?, status = ? WHERE id = ?").bind(name, status, context.client.id).run();
    return json({ client: { ...context.client, name, status } });
  }
  if (request.method === "GET" && route === "/api/connections") return json({ connections: ["youtube", "instagram"].map((provider) => ({ provider, status: "disconnected" })) });
  if (request.method === "GET" && route === "/api/jobs") {
    const { results } = await env.DB.prepare("SELECT id, client_id, source_file_url, title, description, status, targets_json, requested_at, started_at, completed_at, error_message FROM publishing_jobs WHERE client_id = ? ORDER BY requested_at DESC LIMIT 100").bind(context.client.id).all();
    return json({ jobs: results.map((job) => ({ ...job, targets: JSON.parse(job.targets_json) })) });
  }
  if (request.method === "POST" && route === "/api/jobs") {
    let input; try { input = await body(request); } catch { return json({ error: "invalid_json" }, 400); }
    const source = String(input.source_file_url || "").trim();
    const targets = Array.isArray(input.targets) ? input.targets.filter((target) => target === "youtube" || target === "instagram") : ["youtube", "instagram"];
    if (!source || source.length > 2048) return json({ error: "source_file_url_required" }, 400);
    if (!targets.length) return json({ error: "at_least_one_target_required" }, 400);
    const subscription = await env.DB.prepare("SELECT p.monthly_job_limit FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.client_id = ? AND s.status = 'active' AND p.enabled = 1").bind(context.client.id).first();
    const periodStart = new Date(); periodStart.setUTCDate(1); periodStart.setUTCHours(0, 0, 0, 0);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM publishing_jobs WHERE client_id = ? AND requested_at >= ?").bind(context.client.id, periodStart.toISOString()).first();
    if (subscription && Number(count.count) >= subscription.monthly_job_limit) return json({ error: "monthly_job_limit_reached", limit: subscription.monthly_job_limit }, 429);
    const job = { id: id("job"), client_id: context.client.id, source_file_url: source, title: String(input.title || "").slice(0, 500), description: String(input.description || "").slice(0, 5000), targets, status: "queued", requested_at: now(), started_at: null, completed_at: null, error_message: null, request_url: request.url };
    await env.DB.prepare("INSERT INTO publishing_jobs (id, client_id, source_file_url, title, description, status, targets_json, requested_at, started_at, completed_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)")
      .bind(job.id, job.client_id, job.source_file_url, job.title, job.description, job.status, JSON.stringify(job.targets), job.requested_at).run();
    try { job.make = await sendToMake(job, env); } catch { job.make = { sent: false, reason: "make_request_failed" }; }
    delete job.request_url;
    return json({ job }, 201);
  }
  return json({ error: "not_found" }, 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error(JSON.stringify({ event: "request_error", route: url.pathname, message: String(error.message || error) }));
      return json({ error: "internal_server_error" }, 500);
    }
  }
};