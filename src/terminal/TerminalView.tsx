import { useEffect, useRef } from "react";
import { ensureSession, attach, detach, fitSession, getSession } from "./manager";

/**
 * 终端视图：挂载时 attach 常驻 xterm 宿主，卸载时仅 detach（实例与 pty 保活）。
 * 会话由 manager 单例持有，切 Tab / 切任务画面与滚动历史完好。
 */
export function TerminalView({ slug, cwd }: { slug: string; cwd: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    ensureSession(slug, cwd);
    attach(slug, container);

    const ro = new ResizeObserver(() => {
      const s = getSession(slug);
      if (s) fitSession(s);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      detach(slug);
    };
  }, [slug, cwd]);

  return <div ref={containerRef} className="h-full w-full bg-white p-2" />;
}
