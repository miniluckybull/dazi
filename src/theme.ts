// theme.ts — 三态主题控制器（light / dark / system）。
// 偏好存 localStorage（设备级），system 态跟随 prefers-color-scheme 实时切换。
import { setTerminalTheme } from "./terminal/manager";

export type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "dazi_theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<(pref: ThemePref) => void>();

export function getThemePref(): ThemePref {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function resolveDark(pref: ThemePref): boolean {
  if (pref === "system") return media.matches;
  return pref === "dark";
}

function apply(pref: ThemePref) {
  const dark = resolveDark(pref);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  setTerminalTheme(dark);
  listeners.forEach((fn) => fn(pref));
}

export function setThemePref(pref: ThemePref) {
  if (pref === "system") localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, pref);
  apply(pref);
}

/** light → dark → system 循环，返回新偏好。 */
export function cycleTheme(): ThemePref {
  const order: ThemePref[] = ["light", "dark", "system"];
  const next = order[(order.indexOf(getThemePref()) + 1) % order.length];
  setThemePref(next);
  return next;
}

/** 订阅偏好/生效主题变化（用于按钮图标刷新）。返回取消函数。 */
export function onThemeChange(fn: (pref: ThemePref) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 启动时应用一次，并在 system 态下跟随系统外观变化。 */
export function initTheme() {
  apply(getThemePref());
  media.addEventListener("change", () => {
    if (getThemePref() === "system") apply("system");
  });
}
