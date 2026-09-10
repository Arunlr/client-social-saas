const API_BASE = window.CLIENT_SOCIAL_API || "";
const tokenKey = "client_social_access_token";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const token = () => localStorage.getItem(tokenKey);
async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (token()) headers.authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
function escapeHtml(v){return String(v ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function showPortal(){ $("#auth").hidden=true; $("#portal").hidden=false; $("#logout").hidden=false; $("#top-signin").hidden=true; $("#top-start").hidden=true; loadDashboard(); }
function showAuth(){ $("#auth").hidden=false; $("#portal").hidden=true; $("#logout").hidden=true; $("#top-signin").hidden=false; $("#top-start").hidden=false; }
function switchAuth(mode){ const login=mode==="login"; $("#login-tab").classList.toggle("active",login); $("#signup-tab").classList.toggle("active",!login); $("#login-form").hidden=!login; $("#signup-form").hidden=login; $("#auth-message").textContent=""; }
function statusClass(status){return status==="published"?"status-success":status==="failed"?"status-failed":"status-queued";}
function renderJobs(jobs){
  const html=jobs.length?jobs.map(job=>`<div class="content-row"><div class="content-thumb">▶</div><div><b>${escapeHtml(job.title||"Untitled video")}</b><small>${escapeHtml(job.source_file_url||"")}</small></div><span class="pill ${statusClass(job.status)}">${escapeHtml(job.status)}</span><small class="extra">${escapeHtml((job.targets||[]).join(" · "))}</small></div>`).join(""):`<div class="empty"><strong>Your library is ready.</strong><p>Uploaded and queued videos will appear here.</p></div>`;
  if($("#job-list")) $("#job-list").innerHTML=html;
  if($("#history-list")) $("#history-list").innerHTML=jobs.length?html:`<div class="empty"><strong>No publishing history yet.</strong><p>Create your first job to see its progress here.</p></div>`;
  if($("#activity-list")) $("#activity-list").innerHTML=jobs.slice(0,4).map(job=>`<div class="activity-row"><span class="activity-icon purple">✦</span><div><b>${escapeHtml(job.title||"Untitled video")}</b><small>${escapeHtml(job.status)} · ${(job.targets||[]).join(" + ")}</small></div><span class="pill ${statusClass(job.status)}">${escapeHtml(job.status)}</span></div>`).join("")||`<div class="activity-row"><span class="activity-icon purple">✦</span><div><b>No activity yet</b><small>Create your first piece of content to get started.</small></div><span class="pill">Ready</span></div>`;
}
async function loadDashboard(){
  if(!token()) return;
  try{
    const [{jobs},{connections},{user,client}]=await Promise.all([api("/api/jobs"),api("/api/connections"),api("/api/auth/me")]);
    renderJobs(jobs);
    const published=jobs.filter(j=>j.status==="published").length;
    const queued=jobs.filter(j=>["queued","processing"].includes(j.status)).length;
    const failed=jobs.filter(j=>j.status==="failed").length;
    $("#published-count").textContent=published; $("#queued-count")?.replaceChildren(document.createTextNode(queued)); $("#failed-count")?.replaceChildren(document.createTextNode(failed));
    const name=(user?.display_name||client?.name||"Creator").split(" ")[0];
    $("#dashboard-name").textContent=name; $("#greeting-name").textContent=name; $("#workspace-name").textContent=client?.name||"Creator Studio"; $("#workspace-avatar").textContent=(name[0]||"C").toUpperCase(); $("#avatar-letter").textContent=(name[0]||"C").toUpperCase(); $("#settings-name").value=client?.name||"";
    connections.forEach(c=>{const node=document.querySelector(`[data-provider="${c.provider}"] .pill`); if(node) node.textContent=c.status==="connected"?"Connected":"Not connected";});
  }catch(e){console.warn(e.message);}
}
function wire(){
  $("#login-tab")?.addEventListener("click",()=>switchAuth("login"));
  $("#signup-tab")?.addEventListener("click",()=>switchAuth("signup"));
  $("#top-start")?.addEventListener("click",()=>setTimeout(()=>$("#auth-card")?.scrollIntoView({behavior:"smooth",block:"center"}),50));
  $("#login-form")?.addEventListener("submit",async e=>{e.preventDefault();try{const r=await api("/api/auth/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});localStorage.setItem(tokenKey,r.access_token);showPortal();}catch(err){$("#auth-message").textContent=err.message;}});
  $("#signup-form")?.addEventListener("submit",async e=>{e.preventDefault();try{const r=await api("/api/auth/signup",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});localStorage.setItem(tokenKey,r.access_token);showPortal();}catch(err){$("#auth-message").textContent=err.message;}});
  $("#job-form")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));data.targets=["youtube","instagram"].filter(p=>data[p]==="on");delete data.youtube;delete data.instagram;try{await api("/api/jobs",{method:"POST",body:JSON.stringify(data)});form.reset();$("input[name=youtube]").checked=true;$("input[name=instagram]").checked=true;$("#job-message").textContent="Content engine launched — job queued successfully.";await loadDashboard();location.hash="history";}catch(err){$("#job-message").textContent=err.message;}});
  const doLogout=async()=>{try{await api("/api/auth/logout",{method:"POST"});}catch{}localStorage.removeItem(tokenKey);showAuth();window.scrollTo({top:0,behavior:"smooth"});};
  $("#logout")?.addEventListener("click",doLogout); $("#mobile-logout")?.addEventListener("click",doLogout);
  $("#save-settings")?.addEventListener("click",async()=>{try{const r=await api("/api/client",{method:"PATCH",body:JSON.stringify({name:$("#settings-name").value})});$("#settings-message").textContent=`Saved ${r.client.name}.`;await loadDashboard();}catch(err){$("#settings-message").textContent=err.message;}});
  $$(".target").forEach(t=>t.addEventListener("click",()=>{const cb=t.querySelector("input");setTimeout(()=>t.classList.toggle("active",cb.checked),0);}));
}
async function bootstrap(){wire();if(!token()) return showAuth();try{await api("/api/auth/me");showPortal();}catch{localStorage.removeItem(tokenKey);showAuth();}}
bootstrap();
