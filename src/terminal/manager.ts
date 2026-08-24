// terminal/manager.ts — 任务级常驻终端会话管理（模块级单例，不进 zustand：
// xterm 实例是非序列化重对象）。每个任务持有一个 Terminal 实例 + 常驻 DOM 宿主，
// attach/detach 只挂卸 DOM，实例与滚动历史保活，切 Tab / 切任务不销毁。
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { invoke, Channel } from "@tauri-apps/api/core";
import { useApp } from "../store";
import "@xterm/xterm/css/xterm.css";

export type PtyLaunch = "shell" | "handoff" | "plan" | "continue";

type PtyEvent =
  | { type: "output"; data: string }
  | { type: "exit" };

interface PtyOpenResult {
  created: boolean;
  alive: boolean;
  replay: string;
}

export interface TermSession {
  slug: string;
  cwd: string;
  term: Terminal;
  fit: FitAddon;
  host: HTMLDivElement;
  alive: boolean;
  opening: boolean;
}

const sessions = new Map<string, TermSession>();

// claude 等待确认的文案特征（BEL 响铃的兜底信号）
const ATTENTION_RE = /Do you want|❯\s*1\.|Esc to cancel/;

function setAttention(slug: string, v: boolean) {
  useApp.getState().setAttention(slug, v);
}

const LIGHT_THEME = {
  background: "#ffffff",
  foreground: "#211c37",
  cursor: "#7c3aed",
  cursorAccent: "#ffffff",
  selectionBackground: "#ddd6fe",
  selectionForeground: "#211c37",
};

const DARK_THEME = {
  background: "#29253c",
  foreground: "#d8d4e8",
  cursor: "#a78bfa",
  cursorAccent: "#29253c",
  selectionBackground: "#3d3566",
  selectionForeground: "#e4e1f4",
};

let darkMode = false;

/** 切换所有会话（含后续新建）的 xterm 主题，实时生效。 */
export function setTerminalTheme(dark: boolean) {
  darkMode = dark;
  const theme = dark ? DARK_THEME : LIGHT_THEME;
  for (const s of sessions.values()) {
    s.term.options.theme = theme;
  }
}

function createTerminal(): { term: Terminal; fit: FitAddon } {
  const term = new Terminal({
    fontSize: 13,
    // CJK 回退链：英文等宽优先，中文按平台回退到 PingFang SC / 微软雅黑 / Noto CJK，
    // 避免 Windows WebView2 下找不到字体导致汉字渲染为乱码方框（反馈 #10）。
    fontFamily:
      'ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", monospace',
    lineHeight: 1.25,
    scrollback: 5000,
    cursorBlink: true,
    allowProposedApi: true,
    minimumContrastRatio: 4.5,
    theme: darkMode ? DARK_THEME : LIGHT_THEME,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new Unicode11Addon());
  term.unicode.activeVersion = "11";
  return { term, fit };
}

function tryWebgl(term: Terminal) {
  // Windows WebView2 下 WebGL 偶发 dirty rect 失效，导致汉字渲染乱码、框选后才恢复
  // （反馈 #10，主要 Windows 用户）。macOS/Linux 无反馈，保持默认开启。
  if (isWindows()) return;
  try {
    const webgl = new WebglAddon();
    webgl.onContextLoss(() => webgl.dispose()); // 上下文丢失回退 DOM 渲染
    term.loadAddon(webgl);
  } catch {
    // WKWebView / WebView2 下 WebGL 不可用时静默回退 DOM renderer
  }
}

function isWindows(): boolean {
  return /Windows NT/i.test(navigator.userAgent);
}

/** 修复中文输入法直接上屏的全角标点（？：等）在终端丢失：
 *  macOS 输入法对这类标点不走 composition 流程，只发 beforeinput/input；
 *  xterm 只监听 composition* 和 keypress，感知不到 → 字符被吞。
 *  这里在 beforeinput 阶段拦截（preventDefault 阻止落 DOM，不碰 textarea，
 *  避免与 xterm 异步清空 textarea 的竞态），取 e.data 直接写 pty。
 *  拼音选词等组合态（insertCompositionText/insertFromComposition）仍由 xterm 处理。 */
function patchImeDirectInput(term: Terminal) {
  const ta = term.textarea;
  if (!ta) return;
  // WKWebView 在 IME 直出全角标点后，会补发对应半角字符的 keydown（如 ？→ "?"），
  // xterm 会把它当普通按键再发一次，需按映射吞掉。
  const HALFWIDTH: Record<string, string> = {
    "？": "?", "：": ":", "；": ";", "，": ",", "。": ".", "！": "!",
    "（": "(", "）": ")", "【": "[", "】": "]", "《": "<", "》": ">",
    "、": "\\", "“": '"', "”": '"', "‘": "'", "’": "'", "…": "^",
    "·": "`", "￥": "$",
  };
  let lastInsert = { time: 0, data: "" };
  let dropHalfwidthUntil = 0;

  ta.addEventListener("beforeinput", (e) => {
    const ie = e as InputEvent;
    if (ie.isComposing || ie.inputType !== "insertText" || !ie.data) return;
    e.preventDefault();
    if (Date.now() < dropHalfwidthUntil && ie.data === HALFWIDTH[lastInsert.data]) {
      // 补发 keydown 引发的 DOM 插入，丢弃
      return;
    }
    lastInsert = { time: Date.now(), data: ie.data };
    term.input(ie.data);
  });

  term.attachCustomKeyEventHandler((ev) => {
    if (
      ev.type === "keydown" &&
      lastInsert.time &&
      Date.now() - lastInsert.time < 200 &&
      HALFWIDTH[lastInsert.data] === ev.key
    ) {
      // 返回 false 后 xterm 不处理也不 preventDefault，浏览器会继续插入该字符，
      // 用 dropHalfwidthUntil 让上面的 beforeinput 拦截把它丢掉。
      dropHalfwidthUntil = Date.now() + 200;
      return false;
    }
    return true;
  });
}

async function openPty(s: TermSession, launch: PtyLaunch, agentMode: boolean) {
  if (s.opening) return;
  s.opening = true;
  const channel = new Channel<PtyEvent>();
  channel.onmessage = (ev) => {
    if (ev.type === "output") {
      s.term.write(ev.data);
      // 终端不可见时检测确认提示文案，点亮提醒
      if (!s.host.isConnected && ATTENTION_RE.test(ev.data)) {
        setAttention(s.slug, true);
      }
    } else {
      s.alive = false;
      setAttention(s.slug, false);
      s.term.write("\r\n\x1b[2m[会话已结束，按回车重新打开]\x1b[0m\r\n");
    }
  };
  try {
    const r = await invoke<PtyOpenResult>("pty_open", {
      slug: s.slug,
      cwd: s.cwd,
      cols: s.term.cols,
      rows: s.term.rows,
      launch,
      agentMode,
      onEvent: channel,
    });
    s.alive = r.alive;
    if (!r.created && r.replay) {
      // webview 刷新后的恢复路径：回放 scrollback
      s.term.write(r.replay);
    }
  } catch (e) {
    s.alive = false;
    s.term.write(`\r\n\x1b[31m启动终端失败: ${String(e)}\x1b[0m\r\n`);
  } finally {
    s.opening = false;
  }
}

/** 获取或创建任务的终端会话。重复调用幂等（已存在则直接复用）。 */
export function ensureSession(
  slug: string,
  cwd: string,
  launch: PtyLaunch = "shell",
  agentMode = false
): TermSession {
  const existing = sessions.get(slug);
  if (existing) {
    if (!existing.alive && !existing.opening) {
      // 会话已死且用户带着 launch 意图回来：重新打开
      void openPty(existing, launch, agentMode);
    }
    return existing;
  }
  const host = document.createElement("div");
  host.style.width = "100%";
  host.style.height = "100%";
  const { term, fit } = createTerminal();
  term.open(host);
  patchImeDirectInput(term);
  tryWebgl(term);
  const s: TermSession = { slug, cwd, term, fit, host, alive: false, opening: false };
  sessions.set(slug, s);

  term.onData((data) => {
    setAttention(slug, false);
    if (s.alive) {
      void invoke("pty_write", { slug, data });
    } else if (!s.opening && (data === "\r" || data === "\n")) {
      // dead 状态回车重开（纯 shell）
      void openPty(s, "shell", false);
    }
  });

  term.onBell(() => {
    // claude 需要确认/注意时响铃；终端不可见才点亮提醒
    if (!s.host.isConnected) setAttention(slug, true);
  });

  void openPty(s, launch, agentMode);
  return s;
}

/** 带启动意图的入口：优先向已存活 shell 注入 claude 命令（pty_launch），
 * 无存活会话时回落 ensureSession 带意图 spawn。修复"先开终端再点 Send"无反应。 */
export async function requestLaunch(
  slug: string,
  cwd: string,
  launch: PtyLaunch,
  agentMode = false
): Promise<void> {
  try {
    const handled = await invoke<boolean>("pty_launch", { slug, cwd, launch, agentMode });
    if (handled) {
      // 确保前端会话对象存在（已有 pty 时 ensureSession 仅复用）
      ensureSession(slug, cwd);
      return;
    }
  } catch {
    // pty_launch 失败时回落 spawn 路径
  }
  ensureSession(slug, cwd, launch, agentMode);
}

export function getSession(slug: string): TermSession | undefined {
  return sessions.get(slug);
}

/** 杀掉并清除一个任务的终端会话（后端 pty + 前端 map + DOM）。
 *  用于「新建对话」强制重启 claude 重新注入记忆（反馈 #7）。 */
export async function resetSession(slug: string) {
  detach(slug);
  await invoke("pty_kill", { slug }).catch(() => {});
  sessions.delete(slug);
}

/** 把会话的常驻宿主挂到容器上并自适应尺寸。 */
export function attach(slug: string, container: HTMLElement) {
  const s = sessions.get(slug);
  if (!s) return;
  setAttention(slug, false);
  container.appendChild(s.host);
  requestAnimationFrame(() => {
    fitSession(s);
    s.term.focus();
  });
}

/** 仅从 DOM 卸下宿主，实例与 pty 保活。 */
export function detach(slug: string) {
  const s = sessions.get(slug);
  if (!s) return;
  s.host.parentElement?.removeChild(s.host);
}

export function fitSession(s: TermSession) {
  if (!s.host.isConnected) return;
  try {
    s.fit.fit();
  } catch {
    return;
  }
  if (s.alive) {
    void invoke("pty_resize", { slug: s.slug, cols: s.term.cols, rows: s.term.rows });
  }
}
