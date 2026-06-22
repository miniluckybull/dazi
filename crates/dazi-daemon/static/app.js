// Dazi 手机 Web 页 —— 纯原生 JS，无依赖。读写 + 审批 + 实时刷新。
const TOKEN_KEY = "dazi_token";
const app = document.getElementById("app");
let token = localStorage.getItem(TOKEN_KEY);
let ws = null;
let currentView = null; // 记住当前视图，收到事件时刷新

// ---- 主题：三态 light/dark/system，与桌面端 dazi_theme 语义一致 ----
const THEME_KEY = "dazi_theme";
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
function themePref() {
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : "system";
}
function themeIcon(pref) {
  return pref === "light" ? "\u2600\uFE0E" : pref === "dark" ? "\u263D" : "\u25D1";
}
function applyTheme() {
  const pref = themePref();
  const dark = pref === "dark" || (pref === "system" && themeMedia.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = themeIcon(pref);
}
function cycleTheme() {
  const order = ["light", "dark", "system"];
  const next = order[(order.indexOf(themePref()) + 1) % order.length];
  if (next === "system") localStorage.removeItem(THEME_KEY);
  else localStorage.setItem(THEME_KEY, next);
  applyTheme();
}
themeMedia.addEventListener("change", () => {
  if (themePref() === "system") applyTheme();
});
// header 随视图重渲染，用事件委托保证按钮始终可用
app.addEventListener("click", (e) => {
  if (e.target && e.target.id === "themeBtn") cycleTheme();
});
applyTheme();

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
  const t = `<button id="themeBtn" title="切换外观（浅色/深色/跟随系统）">${themeIcon(themePref())}</button>`;
  return `<header>${b}<h1>${esc(title)}</h1>${t}<button id="refresh">刷新</button></header>`;
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
      const schedBtn = `<button id="sched">调度设置（${typeLabel(meta.task_type)}）</button>`;
      m.innerHTML = `<div class="tabs">
        <button data-t="readme" class="${tab === "readme" ? "active" : ""}">README</button>
        <button data-t="journal" class="${tab === "journal" ? "active" : ""}">日志</button>
        <button data-t="context" class="${tab === "context" ? "active" : ""}">上下文</button>
      </div><div id="tabbody"></div><div class="detail-actions">${planBtn}<button id="term" class="btn-primary">在终端中打开</button>${schedBtn}</div>`;
      m.querySelectorAll(".tabs button").forEach((b) => {
        b.onclick = () => { tab = b.dataset.t; load(); };
      });
      const pb = document.getElementById("plan");
      if (pb) pb.onclick = () => startPlan(slug);
      document.getElementById("term").onclick = () => renderTermLaunch(slug, meta.name, !!meta.handed_off_at);
      document.getElementById("sched").onclick = () => renderSchedule(slug);
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
    <button id="ok" class="btn-primary">创建并设置调度</button></main>`;
  document.getElementById("back").onclick = renderList;
  document.getElementById("ok").onclick = async () => {
    const name = document.getElementById("nm").value.trim();
    if (!name) { document.getElementById("err").textContent = "请输入名称"; return; }
    try {
      const p = await apiSend("/projects", "POST", { name });
      banner("已创建");
      renderSchedule(p.slug);
    } catch (e) { document.getElementById("err").textContent = e.message; }
  };
}

const UNIT_LABEL = { minute: "分钟", hour: "小时", day: "天", week: "周", month: "月" };

// datetime-local 值 <-> ISO
function isoToLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function localToIso(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
}

// ---- 调度编辑（新建后 / 详情进入，复用同一界面）----
async function renderSchedule(slug) {
  currentView = () => renderSchedule(slug);
  app.innerHTML = header("任务调度", true) + `<main id="m"><div class="empty">加载中…</div></main>`;
  document.getElementById("back").onclick = () => renderDetail(slug);
  bindRefresh(() => renderSchedule(slug));
  const m = document.getElementById("m");
  let meta;
  try {
    meta = await api("/projects/" + encodeURIComponent(slug));
  } catch (e) { m.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  document.querySelector("header h1").textContent = meta.name + " · 调度";

  const sc = meta.schedule || {};
  const iv = sc.interval || { every: 1, unit: "day" };
  const action = (meta.on_trigger && meta.on_trigger.action) || "notify";
  let type = meta.task_type || "oneoff";

  const render = () => {
    const unitOpts = Object.keys(UNIT_LABEL)
      .map((u) => `<option value="${u}" ${iv.unit === u ? "selected" : ""}>${UNIT_LABEL[u]}</option>`).join("");
    m.innerHTML = `
      <div class="seg">
        ${["oneoff", "scheduled", "recurring"].map((t) =>
          `<button data-type="${t}" class="${type === t ? "active" : ""}">${typeLabel(t)}</button>`).join("")}
      </div>
      <div id="schedFields"></div>
      <div id="actionBox" class="${type === "oneoff" ? "hidden" : ""}">
        <div class="sec-title">到点动作</div>
        <div class="seg sm">
          <button data-act="notify" class="${action === "notify" ? "active" : ""}">提醒我</button>
          <button data-act="autopilot" class="${action === "autopilot" ? "active" : ""}">自动执行</button>
        </div>
        <div id="riskHint" class="${action === "autopilot" ? "" : "hidden"}">
          <p class="risk">自动执行会让 Claude 在到点时按调度运行。在手机端，建议配合「先出计划待批」使用。</p>
        </div>
      </div>
      <button id="saveS" class="btn-primary">保存调度</button><span id="st" class="st"></span>`;

    const sf = document.getElementById("schedFields");
    if (type === "scheduled") {
      sf.innerHTML = `<label class="fld">触发时间<input type="datetime-local" id="runAt" value="${isoToLocal(sc.run_at)}"></label>`;
    } else if (type === "recurring") {
      sf.innerHTML = `
        <label class="fld">首次时间（可选）<input type="datetime-local" id="runAt" value="${isoToLocal(sc.run_at)}"></label>
        <label class="fld">每隔
          <span class="inline"><input type="number" id="every" min="1" value="${iv.every || 1}" style="width:72px">
          <select id="unit">${unitOpts}</select></span>
        </label>`;
    } else {
      sf.innerHTML = `<p class="risk">一次性任务：做完即可归档，无需调度。</p>`;
    }

    m.querySelectorAll(".seg button[data-type]").forEach((b) => {
      b.onclick = () => { type = b.dataset.type; render(); };
    });
    m.querySelectorAll(".seg button[data-act]").forEach((b) => {
      b.onclick = () => { meta.on_trigger = { action: b.dataset.act }; render2(); };
    });
    function render2() {
      // 仅切换 action 高亮，无需整体重渲染调度字段
      const act = meta.on_trigger.action;
      m.querySelectorAll(".seg button[data-act]").forEach((x) =>
        x.classList.toggle("active", x.dataset.act === act));
      document.getElementById("riskHint").classList.toggle("hidden", act !== "autopilot");
    }
    document.getElementById("saveS").onclick = () => saveSchedule(slug, type, meta);
  };
  render();
}

async function saveSchedule(slug, type, meta) {
  const st = document.getElementById("st");
  const act = (meta.on_trigger && meta.on_trigger.action) || "notify";
  let schedule = null;
  if (type === "scheduled") {
    const runAt = localToIso(document.getElementById("runAt").value);
    if (!runAt) { st.textContent = "请选择触发时间"; return; }
    schedule = { run_at: runAt };
  } else if (type === "recurring") {
    const every = Math.max(1, parseInt(document.getElementById("every").value || "1", 10));
    const unit = document.getElementById("unit").value;
    const runAt = localToIso(document.getElementById("runAt").value);
    schedule = { run_at: runAt, interval: { every, unit } };
  }
  const patch = {
    task_type: type,
    schedule,
    on_trigger: { action: type === "oneoff" ? "notify" : act },
  };
  st.textContent = "保存中…";
  try {
    await apiSend("/projects/" + encodeURIComponent(slug) + "/schedule", "PUT", patch);
    banner("调度已保存");
    renderDetail(slug);
  } catch (e) { st.textContent = "失败：" + e.message; }
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

// ---- 交互式终端 ----
// 启动方式：与 PC 端一致的单按钮智能切换——未交接过显示「交接给 Claude」（注入
// 项目上下文），已交接过显示「继续上次会话」（claude -c，不重注入）。纯 shell 弱化为次要入口。
function renderTermLaunch(slug, name, handedOff) {
  currentView = null; // 静态页，WS 事件不触发重渲染
  const mainBtn = handedOff
    ? `<button class="btn-primary" data-l="continue">继续上次 Claude 会话</button>`
    : `<button class="btn-primary" data-l="handoff">交接给 Claude（注入项目上下文）</button>`;
  const hint = handedOff
    ? "已交接过，继续上次对话不会重新注入上下文。"
    : "首次交接会把项目上下文注入给 Claude。";
  app.innerHTML = header("打开终端", true) + `<main id="m">
    <p class="fld">为「${esc(name)}」开一个终端会话。与电脑端是各自独立的 shell，但会话历史按项目共享，可异步接力。</p>
    <p class="fld" style="color:var(--text-faint)">${hint}</p>
    <div class="term-launch">
      ${mainBtn}
      <button data-l="shell" style="opacity:.7">纯终端 Shell（不启动 Claude）</button>
    </div></main>`;
  document.getElementById("back").onclick = () => renderDetail(slug);
  document.querySelectorAll("[data-l]").forEach((b) => {
    b.onclick = () => renderTerminal(slug, name, b.dataset.l);
  });
}

// 终端主体：全屏 xterm + 双向 WebSocket + 虚拟功能键。
let termState = null; // { term, ws, closed, onResize, onOnline } —— 离开视图时清理
let termOutputQueue = [];       // 输出批量缓冲
let termOutputRaf = null;       // requestAnimationFrame id
let termInputBuf = "";          // 输入合并缓冲
let termInputTimer = null;      // 输入合并定时器
let termReconnectDelay = 1000;  // 当前重连退避（ms）
const TERM_MAX_RECONNECT_DELAY = 30000;
function renderTerminal(slug, name, launch) {
  currentView = null; // 终端是有状态视图，绝不能被 WS 事件重渲染清掉
  cleanupTerm();
  app.innerHTML = `<div class="term-wrap">
    ${header(name, true)}
    <div class="term-host" id="thost"></div>
    <div class="term-keys" id="tkeys"></div>
  </div>`;
  document.getElementById("back").onclick = () => { cleanupTerm(); renderDetail(slug); };
  document.getElementById("refresh").onclick = () => renderTerminal(slug, name, "shell");
  // header 里追加「结束会话」按钮：明确 kill PTY+claude，跨端接力前的清理操作。
  const endBtn = document.createElement("button");
  endBtn.textContent = "结束会话";
  endBtn.style.color = "var(--c-err)";
  endBtn.onclick = () => endTermSession(slug);
  document.querySelector(".term-wrap header").insertBefore(
    endBtn, document.getElementById("refresh"));

  const term = new Terminal({
    fontSize: 13, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    cursorBlink: true, scrollback: 5000,
    theme: { background: "#1e1e1e", foreground: "#d4d4d4", cursor: "#7c3aed" },
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("thost"));

  // 手势滚动：在终端显示区上下滑动滚动 xterm.js 回滚缓冲区。
  // 垂直位移超过阈值且大于水平位移时判定为滚动；否则把事件留给 xterm 处理选择/点击。
  const host = document.getElementById("thost");
  let touchStartY = 0, touchStartX = 0, touchStartTime = 0, isTermScrolling = false;
  const TERM_SCROLL_THRESHOLD_PX = 10;
  const TERM_SCROLL_LINES_PER_PX = 1 / 18;

  host.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    isTermScrolling = false;
  }, { passive: true });

  host.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const dy = touchStartY - e.touches[0].clientY;
    const dx = touchStartX - e.touches[0].clientX;

    if (!isTermScrolling) {
      if (Math.abs(dy) > TERM_SCROLL_THRESHOLD_PX && Math.abs(dy) > Math.abs(dx) * 1.5) {
        isTermScrolling = true;
      } else {
        return; // 让 xterm 处理选择/点击
      }
    }

    e.preventDefault();
    const lines = Math.round(dy * TERM_SCROLL_LINES_PER_PX);
    if (lines !== 0) {
      term.scrollLines(lines);
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: false });

  host.addEventListener("touchend", (e) => {
    const elapsed = Date.now() - touchStartTime;
    if (!isTermScrolling && elapsed < 300) {
      term.focus();
    }
    isTermScrolling = false;
  }, { passive: true });

  requestAnimationFrame(() => { try { fit.fit(); } catch {} term.focus(); });

  const state = { term, ws: null, closed: false };
  termState = state;

  // 输出批量：通过 requestAnimationFrame 把一帧内到达的 PTY 输出合并写入，
  // 避免高输出频率下 xterm.js 逐字符重绘。
  function flushTermOutput() {
    termOutputRaf = null;
    if (termOutputQueue.length === 0) return;
    const data = termOutputQueue.join("");
    termOutputQueue.length = 0;
    term.write(data);
  }

  // 输入合并：单字符输入攒 8ms 一次性发，多字符（粘贴/转义）立即发。
  function flushTermInput() {
    termInputTimer = null;
    if (termInputBuf.length && state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({ type: "input", data: termInputBuf }));
    }
    termInputBuf = "";
  }

  const connect = () => {
    if (state.closed) return;
    fit.fit();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const qs = `token=${encodeURIComponent(token)}&launch=${launch}` +
      `&cols=${term.cols}&rows=${term.rows}`;
    const ws = new WebSocket(
      `${proto}://${location.host}/api/v1/projects/${encodeURIComponent(slug)}/terminal?${qs}`);
    state.ws = ws;

    ws.onopen = () => {
      termReconnectDelay = 1000;
    };

    ws.onmessage = (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === "output") {
        termOutputQueue.push(msg.data);
        if (!termOutputRaf) termOutputRaf = requestAnimationFrame(flushTermOutput);
      } else if (msg.type === "exit") {
        if (termOutputRaf) { cancelAnimationFrame(termOutputRaf); termOutputRaf = null; }
        flushTermOutput();
        term.write("\r\n\x1b[2m[会话已结束]\x1b[0m\r\n");
      }
    };

    ws.onclose = () => {
      state.ws = null;
      if (termOutputRaf) { cancelAnimationFrame(termOutputRaf); termOutputRaf = null; }
      flushTermOutput();
      if (!state.closed) {
        const delaySec = Math.round(termReconnectDelay / 1000);
        term.write(`\r\n\x1b[33m[连接断开，${delaySec} 秒后重连…]\x1b[0m\r\n`);
        setTimeout(() => {
          termReconnectDelay = Math.min(termReconnectDelay * 2, TERM_MAX_RECONNECT_DELAY);
          connect();
        }, termReconnectDelay);
      }
    };

    ws.onerror = () => { try { ws.close(); } catch {} };
  };
  connect();

  // 网络恢复时立即重连。
  const onOnline = () => {
    if (!state.closed && !state.ws) {
      termReconnectDelay = 1000;
      connect();
    }
  };
  window.addEventListener("online", onOnline);
  state.onOnline = onOnline;

  // 用户输入 → WS。重连后 launch 仅首次生效，后续复用同一 PTY。
  term.onData((data) => {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
    if (data.length > 1) {
      // 粘贴或功能键序列：立即发送，并清空已缓冲的单字符。
      if (termInputTimer) { clearTimeout(termInputTimer); flushTermInput(); }
      state.ws.send(JSON.stringify({ type: "input", data }));
    } else {
      termInputBuf += data;
      if (!termInputTimer) termInputTimer = setTimeout(flushTermInput, 8);
    }
  });

  // resize：fit 后把新尺寸告知服务端。
  const sendResize = () => {
    try { fit.fit(); } catch { return; }
    if (state.ws && state.ws.readyState === WebSocket.OPEN)
      state.ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
  };
  state.onResize = sendResize;
  window.addEventListener("resize", sendResize);

  renderTermKeys(state);
}

// 离开终端视图时：标记关闭、断 WS、卸监听、清缓冲、销毁 xterm 实例。
function cleanupTerm() {
  const s = termState;
  if (!s) return;
  termState = null;
  s.closed = true;
  if (s.onResize) window.removeEventListener("resize", s.onResize);
  if (s.onOnline) window.removeEventListener("online", s.onOnline);
  if (s.ws) { try { s.ws.close(); } catch {} }
  if (termInputTimer) { clearTimeout(termInputTimer); termInputTimer = null; }
  if (termOutputRaf) { cancelAnimationFrame(termOutputRaf); termOutputRaf = null; }
  if (termOutputQueue.length) {
    try { s.term.write(termOutputQueue.join("")); } catch {}
    termOutputQueue.length = 0;
  }
  termInputBuf = "";
  termReconnectDelay = 1000;
  try { s.term.dispose(); } catch {}
}

// 结束会话：明确 kill 掉 daemon 侧 PTY（连同里面的 claude），然后回详情页。
// 跨端接力前用它清理，避免两端 claude 同时读写同一会话历史。
async function endTermSession(slug) {
  if (!confirm("结束会话会关闭终端里正在运行的 Claude/命令。确定？")) return;
  cleanupTerm(); // 先断本地 WS，避免断开重连提示
  try {
    await apiSend("/projects/" + encodeURIComponent(slug) + "/terminal", "DELETE");
    banner("会话已结束");
  } catch (e) { banner("结束失败：" + e.message); }
  renderDetail(slug);
}

// 虚拟功能键条：手机软键盘缺这些键，claude 交互菜单要用方向键/Esc/回车。
// Ctrl 为粘滞修饰键：点亮后下一个字母键发对应控制字符。
function renderTermKeys(state) {
  const keys = document.getElementById("tkeys");
  // [标签, 直接发送的字节] —— ctrl 特殊处理
  const defs = [
    ["esc", "\x1b"], ["tab", "\t"], ["ctrl", null],
    ["↑", "\x1b[A"], ["↓", "\x1b[B"], ["←", "\x1b[D"], ["→", "\x1b[C"],
    ["⏎", "\r"], ["⌫", "\x7f"],
  ];
  keys.innerHTML = defs.map(([label]) =>
    `<button data-k="${esc(label)}">${esc(label)}</button>`).join("");
  let ctrl = false;
  const send = (d) => {
    if (state.ws && state.ws.readyState === WebSocket.OPEN)
      state.ws.send(JSON.stringify({ type: "input", data: d }));
    state.term.focus();
  };
  keys.querySelectorAll("button").forEach((b, i) => {
    const seq = defs[i][1];
    b.onclick = () => {
      const label = defs[i][0];
      if (label === "ctrl") {
        ctrl = !ctrl;
        b.classList.toggle("on", ctrl);
        state.term.focus();
        return;
      }
      send(seq);
    };
  });
  // Ctrl 粘滞：捕获下一个普通字符键，转成控制字符（如 Ctrl+C=\x03）。
  state.term.attachCustomKeyEventHandler((e) => {
    if (!ctrl || e.type !== "keydown") return true;
    const k = e.key.toLowerCase();
    if (k.length === 1 && k >= "a" && k <= "z") {
      send(String.fromCharCode(k.charCodeAt(0) - 96));
      ctrl = false;
      const cb = keys.querySelector('[data-k="ctrl"]');
      if (cb) cb.classList.remove("on");
      return false; // 拦截，避免 xterm 再发原字符
    }
    return true;
  });
}

// ---- 入口 ----
if (token) { connectWs(); renderList(); }
else renderPair();