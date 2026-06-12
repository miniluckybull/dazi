import { useLayoutEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

/**
 * Crepe 所见即所得 Markdown 编辑器包装。
 * 注意：defaultValue 只在挂载时生效，切换项目时通过外层 key={slug} 重建实例。
 */
export function MarkdownEditor({
  defaultValue,
  onChange,
}: {
  defaultValue: string;
  onChange: (markdown: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const crepe = new Crepe({
      root: host,
      defaultValue,
    });
    let destroyed = false;
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        if (destroyed) return;
        onChangeRef.current(markdown);
      });
    });
    crepe.create();
    return () => {
      destroyed = true;
      crepe.destroy();
    };
    // 仅挂载时初始化；defaultValue 变化由外层 key 触发重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="crepe-host h-full overflow-y-auto" />;
}
