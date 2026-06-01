// Dazi 手机 Web 页 —— 纯原生 JS，无依赖。读写 + 审批 + 实时刷新。
const TOKEN_KEY = "dazi_token";
const app = document.getElementById("app");
let token = localStorage.getItem(TOKEN_KEY);
let ws = null;
let currentView = null; // 记住当前视图，收到事件时刷新

async function api(path) {
  return apiSend(path, "GET");
}

async function apiSend(path, method, body) {
  const opts = { method, headers: { Authorization: "Bearer " + token } };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch("/api/v1" + path, opts);
  if (res.status === 401) {
    token = null;
    localStorage.removeItem(TOKEN_KEY);
    renderPair();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const b = await res.json().catch(() => ({ error: "请求失败 " + res.status }));
    throw new Error(b.error || "请求失败 " + res.status);
  }
  return res.status === 204 ? null : res.json();
}

function esc(s) {
  return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function header(title, back) {
  const b = back ? `<button id="back">‹ 返回</button>` : "";
  return `<header>${b}<h1>${esc(title)}</h1><button id="refresh">刷新</button></header>`;
}

function typeLabel(t) {
  return { oneoff: "一次性", scheduled: "定时", recurring: "循环" }[t] || t;
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---- WebSocket 实时事件 ----
function connectWs() {
  if (!token || ws) return;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/api/v1/events?token=${encodeURIComponent(token)}`);
  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.type === "lagged") { if (currentView) currentView(); return; }
    // 任意事件都触发当前视图刷新（列表/审批会重拉）
    if (currentView) currentView();
    if (msg.type === "approval-requested") {
      banner(`新审批请求：${msg.data?.name || ""}`);
    } else if (msg.type === "task-completed") {
      banner(`${msg.data?.name || "任务"} 执行${msg.data?.ok ? "成功" : "失败"}`);
    }
  };
  ws.onclose = () => { ws = null; setTimeout(connectWs, 3000); };
  ws.onerror = () => { try { ws.close(); } catch {} };
}

function banner(text) {
  let el = document.getElementById("banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "banner";
    el.className = "banner";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3500);
}

// ---- 配对页 ----
function renderPair() {
  currentView = null;
  app.innerHTML = `
    <div class="pair-box">
      <h2>连接 Dazi</h2>
      <p>在电脑上启动 dazi-daemon，输入终端显示的 6 位配对码。</p>
      <input id="pin" type="tel" inputmode="numeric" maxlength="6" placeholder="------">
      <div class="err" id="err"></div>
      <button id="go">配对</button>
    </div>`;
  const pin = document.getElementById("pin");
  const err = document.getElementById("err");
  pin.focus();
  document.getElementById("go").onclick = async () => {
    err.textContent = "";
    try {
      const res = await fetch("/api/v1/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.value.trim(), device_name: navigator.userAgent.slice(0, 40) }),
      });
      if (!res.ok) { err.textContent = res.status === 401 ? "配对码不正确" : "配对失败"; return; }
      const data = await res.json();
      token = data.device_token;
      localStorage.setItem(TOKEN_KEY, token);
      connectWs();
      renderList();
    } catch (e) { err.textContent = "无法连接到 daemon"; }
  };
}

// ---- 项目列表 + 待办 + 审批 ----
async function renderList() {
  currentView = renderList;
  app.innerHTML = header("Dazi 任务") +
    `<main id="m"><div class="toolbar"><button id="new" class="btn-primary">+ 新建任务</button>` +
    `<button id="mem">记忆</button></div><div id="body"><div class="empty">加载中…</div></div></main>`;
  bindRefresh(renderList);
  document.getElementById("new").onclick = renderNewTask;
  document.getElementById("mem").onclick = renderMemory;
  const body = document.getElementById("body");
  try {
    const [projects, due, approvals] = await Promise.all([
      api("/projects"), api("/due"), api("/approvals"),
    ]);
    let html = "";
    if (approvals.length) {
      html += `<div class="sec-title">待审批 (${approvals.length})</div>`;
      html += approvals.map(approvalCard).join("");
    }
    if (due.length) {
      html += `<div class="sec-title">待触发 (${due.length})</div>`;
      html += due.map((d) => `
        <div class="card due" data-slug="${esc(d.slug)}">
          <div class="name">${esc(d.name)}</div>
          <div class="meta"><span>${esc(d.action)}</span><span>${fmtTime(d.due_at)}</span></div>
        </div>`).join("");
    }
    const active = projects.filter((p) => !p.archived);
    const archived = projects.filter((p) => p.archived);
    html += `<div class="sec-title">活动 (${active.length})</div>`;
    html += active.map(card).join("") || `<div class="empty">暂无活动任务</div>`;
    if (archived.length) {
      html += `<div class="sec-title">已归档 (${archived.length})</div>`;
      html += archived.map(card).join("");
    }
    body.innerHTML = html;
    body.querySelectorAll(".card[data-slug]").forEach((el) => {
      if (el.classList.contains("approval")) return;
      el.onclick = () => renderDetail(el.dataset.slug);
    });
    body.querySelectorAll("[data-approve]").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); decide(b.dataset.slug, b.dataset.id, true); };
    });
    body.querySelectorAll("[data-reject]").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); decide(b.dataset.slug, b.dataset.id, false); };
    });
  } catch (e) {
    body.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

function approvalCard(a) {
  return `
    <div class="card approval" data-slug="${esc(a.slug)}">
      <div class="name">${esc(a.name)}</div>
      <pre class="plan">${esc(a.plan)}</pre>
      <div class="approve-row">
        <button class="btn-reject" data-reject data-slug="${esc(a.slug)}" data-id="${esc(a.id)}">拒绝</button>
        <button class="btn-approve" data-approve data-slug="${esc(a.slug)}" data-id="${esc(a.id)}">批准并执行</button>
      </div>
    </div>`;
}

async function decide(slug, id, approved) {
  if (approved && !confirm("批准后将以「跳过权限」模式真正执行，确定？")) return;
  try {
    await apiSend(`/projects/${encodeURIComponent(slug)}/approvals/${encodeURIComponent(id)}`, "POST", { approved });
    banner(approved ? "已批准，开始执行…" : "已拒绝");
    renderList();
  } catch (e) { banner("操作失败：" + e.message); }
}

function card(p) {
  const badge = p.archived ? "archived" : p.task_type;
  const badgeText = p.archived ? "归档" : typeLabel(p.task_type);
  const next = p.next_run_at ? `<span>下次 ${fmtTime(p.next_run_at)}</span>` : "";
  return `
    <div class="card" data-slug="${esc(p.slug)}">
      <div class="name">${esc(p.name)}</div>
      <div class="meta"><span class="badge ${badge}">${badgeText}</span>${next}</div>
    </div>`;
}

function bindRefresh(fn) {
  const r = document.getElementById("refresh");
  if (r) r.onclick = fn;
}

// ---- 项目详情（可编辑 README + 发起审批计划）----
async function renderDetail(slug) {
  currentView = () => renderDetail(slug);
  app.innerHTML = header("加载中…", true) + `<main id="m"><div class="empty">加载中…</div></main>`;
  document.getElementById("back").onclick = renderList;
  bindRefresh(() => renderDetail(slug));
  const m = document.getElementById("m");
  try {
    const meta = await api("/projects/" + encodeURIComponent(slug));
    document.querySelector("header h1").textContent = meta.name;
    let tab = "readme";
    const load = async () => {
      const planBtn = meta.task_type !== "oneoff"
        ? `<button id="plan" class="btn-primary">发起自动执行（先出计划待批）</button>` : "";
      m.innerHTML = `<div class="tabs">
        <button data-t="readme" class="${tab === "readme" ? "active" : ""}">README</button>
        <button data-t="journal" class="${tab === "journal" ? "active" : ""}">日志</button>
        <button data-t="context" class="${tab === "context" ? "active" : ""}">上下文</button>
      </div><div id="tabbody"></div><div class="detail-actions">${planBtn}</div>`;
      m.querySelectorAll(".tabs button").forEach((b) => {
        b.onclick = () => { tab = b.dataset.t; load(); };
      });
      const pb = document.getElementById("plan");
      if (pb) pb.onclick = () => startPlan(slug);
      const tb = document.getElementById("tabbody");
      const data = await api("/projects/" + encodeURIComponent(slug) + "/" + tab);
      if (tab === "readme") {
        tb.innerHTML = `<textarea id="ed">${esc(data.content)}</textarea>
          <button id="save" class="btn-primary">保存 README</button><span id="st" class="st"></span>`;
        document.getElementById("save").onclick = async () => {
          const st = document.getElementById("st");
          st.textContent = "保存中…";
          try {
            await apiSend("/projects/" + encodeURIComponent(slug) + "/readme", "PUT",
              { content: document.getElementById("ed").value });
            st.textContent = "已保存";
          } catch (e) { st.textContent = "失败：" + e.message; }
        };
      } else {
        tb.innerHTML = `<pre>${esc(data.content) || "（空）"}</pre>`;
      }
    };
    await load();
  } catch (e) {
    m.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

async function startPlan(slug) {
  if (!confirm("将让 Claude 以只读模式生成执行计划，完成后推送到此处等待你批准。继续？")) return;
  banner("正在生成计划，可能需要一会儿…");
  try {
    await apiSend("/projects/" + encodeURIComponent(slug) + "/plan", "POST");
    banner("计划已生成，请到列表「待审批」查看");
    renderList();
  } catch (e) { banner("生成计划失败：" + e.message); }
}

// ---- 新建任务 ----
function renderNewTask() {
  currentView = null;
  app.innerHTML = header("新建任务", true) + `<main id="m">
    <label class="fld">任务名称<input id="nm" placeholder="例如：每日竞品摘要"></label>
    <div class="err" id="err"></div>
    <button id="ok" class="btn-primary">创建</button></main>`;
  document.getElementById("back").onclick = renderList;
  document.getElementById("ok").onclick = async () => {
    const name = document.getElementById("nm").value.trim();
    if (!name) { document.getElementById("err").textContent = "请输入名称"; return; }
    try {
      const p = await apiSend("/projects", "POST", { name });
      banner("已创建");
      renderDetail(p.slug);
    } catch (e) { document.getElementById("err").textContent = e.message; }
  };
}

// ---- 全局记忆编辑 ----
async function renderMemory() {
  currentView = renderMemory;
  app.innerHTML = header("我的记忆", true) + `<main id="m"><div class="empty">加载中…</div></main>`;
  document.getElementById("back").onclick = renderList;
  const m = document.getElementById("m");
  let which = "facts";
  const load = async () => {
    m.innerHTML = `<div class="tabs">
      <button data-w="facts" class="${which === "facts" ? "active" : ""}">世界事实</button>
      <button data-w="profile" class="${which === "profile" ? "active" : ""}">画像</button>
      <button data-w="patterns" class="${which === "patterns" ? "active" : ""}">模式</button>
    </div><div id="mb"></div>`;
    m.querySelectorAll(".tabs button").forEach((b) => {
      b.onclick = () => { which = b.dataset.w; load(); };
    });
    const data = await api("/memory/" + which).catch(() => ({ content: "" }));
    const mb = document.getElementById("mb");
    mb.innerHTML = `<textarea id="ed">${esc(data.content)}</textarea>
      <button id="save" class="btn-primary">保存</button><span id="st" class="st"></span>`;
    document.getElementById("save").onclick = async () => {
      const st = document.getElementById("st");
      st.textContent = "保存中…";
      try {
        await apiSend("/memory/" + which, "PUT", { content: document.getElementById("ed").value });
        st.textContent = "已保存";
      } catch (e) { st.textContent = "失败：" + e.message; }
    };
  };
  await load();
}

// ---- 入口 ----
if (token) { connectWs(); renderList(); }
else renderPair();
