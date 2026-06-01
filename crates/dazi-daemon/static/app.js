// Dazi 手机只读 Web 页 —— 纯原生 JS，无依赖。
const TOKEN_KEY = "dazi_token";
const app = document.getElementById("app");
let token = localStorage.getItem(TOKEN_KEY);

async function api(path) {
  const res = await fetch("/api/v1" + path, {
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401) {
    token = null;
    localStorage.removeItem(TOKEN_KEY);
    renderPair();
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(body.error || "请求失败 " + res.status);
  }
  return res.json();
}

function esc(s) {
  return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function header(title, back) {
  const b = back ? `<button id="back">‹ 返回</button>` : "";
  const r = `<button id="refresh">刷新</button>`;
  return `<header>${b}<h1>${esc(title)}</h1>${r}</header>`;
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

// ---- 配对页 ----
function renderPair() {
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
      if (!res.ok) {
        err.textContent = res.status === 401 ? "配对码不正确" : "配对失败";
        return;
      }
      const data = await res.json();
      token = data.device_token;
      localStorage.setItem(TOKEN_KEY, token);
      renderList();
    } catch (e) {
      err.textContent = "无法连接到 daemon";
    }
  };
}

// ---- 项目列表 + 待办 ----
async function renderList() {
  app.innerHTML = header("Dazi 任务") + `<main id="m"><div class="empty">加载中…</div></main>`;
  bindRefresh(renderList);
  const m = document.getElementById("m");
  try {
    const [projects, due] = await Promise.all([api("/projects"), api("/due")]);
    let html = "";
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
    m.innerHTML = html;
    m.querySelectorAll(".card").forEach((el) => {
      el.onclick = () => renderDetail(el.dataset.slug);
    });
  } catch (e) {
    m.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
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

// ---- 项目详情 ----
async function renderDetail(slug) {
  app.innerHTML = header("加载中…", true) + `<main id="m"><div class="empty">加载中…</div></main>`;
  document.getElementById("back").onclick = renderList;
  const m = document.getElementById("m");
  try {
    const meta = await api("/projects/" + encodeURIComponent(slug));
    document.querySelector("header h1").textContent = meta.name;
    let tab = "readme";
    const load = async () => {
      m.innerHTML = `<div class="tabs">
        <button data-t="readme" class="${tab === "readme" ? "active" : ""}">README</button>
        <button data-t="journal" class="${tab === "journal" ? "active" : ""}">日志</button>
        <button data-t="context" class="${tab === "context" ? "active" : ""}">上下文</button>
      </div><pre id="content">加载中…</pre>`;
      m.querySelectorAll(".tabs button").forEach((b) => {
        b.onclick = () => { tab = b.dataset.t; load(); };
      });
      const data = await api("/projects/" + encodeURIComponent(slug) + "/" + tab);
      document.getElementById("content").textContent = data.content || "（空）";
    };
    await load();
  } catch (e) {
    m.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

function bindRefresh(fn) {
  const r = document.getElementById("refresh");
  if (r) r.onclick = fn;
}

// ---- 入口 ----
if (token) renderList();
else renderPair();
