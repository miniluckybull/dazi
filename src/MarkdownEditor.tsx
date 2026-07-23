import { useLayoutEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import { commandsCtx } from "@milkdown/kit/core";
import {
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  createCodeBlockCommand,
  turnIntoTextCommand,
  isNodeSelectedCommand,
  headingSchema,
  blockquoteSchema,
  bulletListSchema,
  orderedListSchema,
  codeBlockSchema,
} from "@milkdown/kit/preset/commonmark";
import type { Ctx } from "@milkdown/kit/ctx";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

// 24x24 stroke 图标（与 Crepe 内置 toolbar 同风格），lucide 路径。
const icon = (d: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

const H1_ICON = icon("M4 12h8M4 18V6M12 18V6M17 12l3-2v8");
const H2_ICON = icon("M4 12h8M4 18V6M12 18V6M21 18h-4c0-4 4-3 4-6 0-1.3-.7-2-2-2s-2 .7-2 2");
const H3_ICON = icon("M4 12h8M4 18V6M12 18V6M16.5 10.5c.5-1 2.5-1 3 .5.3 1-.7 1.7-1.5 2 1 .3 2 1 1.5 2.5-.5 1.5-2.5 1.5-3 .5");
const BULLET_ICON = icon("M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01");
const ORDERED_ICON = icon("M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 16h2c0-1-2-1-2-2 0-1 2-1 2-2");
const QUOTE_ICON = icon("M6 17h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1m11 5h3a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1");
const CODEBLOCK_ICON = icon("m16 18 6-6-6-6M8 6l-6 6 6 6");
const PARAGRAPH_ICON = icon("M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13");

/** 选中文字后浮现的工具栏：补齐标题/列表/编号/引用/代码块（反馈 #4）。 */
function buildToolbar(builder: any) {
  const cmd = (ctx: Ctx, key: any, arg?: unknown) => {
    ctx.get(commandsCtx).call(key, arg);
  };
  const active = (ctx: Ctx, nodeType: any) => {
    return ctx.get(commandsCtx).call(isNodeSelectedCommand.key, nodeType.type(ctx));
  };

  const block = builder.addGroup("block", "块级").clear();
  block
    .addItem("h1", {
      icon: H1_ICON,
      active: (ctx: Ctx) => active(ctx, headingSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInHeadingCommand.key, 1),
    })
    .addItem("h2", {
      icon: H2_ICON,
      active: (ctx: Ctx) => active(ctx, headingSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInHeadingCommand.key, 2),
    })
    .addItem("h3", {
      icon: H3_ICON,
      active: (ctx: Ctx) => active(ctx, headingSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInHeadingCommand.key, 3),
    })
    .addItem("paragraph", {
      icon: PARAGRAPH_ICON,
      active: () => false,
      onRun: (ctx: Ctx) => cmd(ctx, turnIntoTextCommand.key),
    });

  const list = builder.addGroup("list", "列表").clear();
  list
    .addItem("bullet", {
      icon: BULLET_ICON,
      active: (ctx: Ctx) => active(ctx, bulletListSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInBulletListCommand.key),
    })
    .addItem("ordered", {
      icon: ORDERED_ICON,
      active: (ctx: Ctx) => active(ctx, orderedListSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInOrderedListCommand.key),
    })
    .addItem("quote", {
      icon: QUOTE_ICON,
      active: (ctx: Ctx) => active(ctx, blockquoteSchema),
      onRun: (ctx: Ctx) => cmd(ctx, wrapInBlockquoteCommand.key),
    })
    .addItem("codeblock", {
      icon: CODEBLOCK_ICON,
      active: (ctx: Ctx) => active(ctx, codeBlockSchema),
      onRun: (ctx: Ctx) => cmd(ctx, createCodeBlockCommand.key),
    });
}

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
      features: {
        [Crepe.Feature.Toolbar]: true,
        [Crepe.Feature.LinkTooltip]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Toolbar]: {
          buildToolbar,
        },
      },
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
