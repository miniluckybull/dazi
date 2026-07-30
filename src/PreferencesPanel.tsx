import { useEffect, useState } from "react";
import { X, Terminal, Coins } from "lucide-react";
import { useApp } from "./store";

type Tab = "backend" | "usage";

export function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("backend");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex h-[80vh] w-[min(720px,90vw)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-glass-lg backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/60 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">设置</h2>
            <p className="text-[11px] text-gray-500">
              CLI 后端选择与模型连通性检测，以及 autopilot 的 token 用量统计。
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/60 bg-white/70 text-gray-600 transition hover:bg-white"
          >
            <X size={15} />
          </button>
        </header>
        <div className="flex border-b border-white/60 text-xs">
          <button
            onClick={() => setTab("backend")}
            className={`flex-1 py-2 transition ${
              tab === "backend"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            <Terminal size={11} className="mr-1 inline-block align-middle" />
            CLI 后端
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/config.json
            </span>
          </button>
          <button
            onClick={() => setTab("usage")}
            className={`flex-1 py-2 transition ${
              tab === "usage"
                ? "bg-white/70 font-medium text-gray-800"
                : "text-gray-500 hover:bg-white/40"
            }`}
          >
            <Coins size={11} className="mr-1 inline-block align-middle" />
            用量
            <span className="ml-1.5 text-[10px] text-gray-400">
              ~/.dazi/usage/
            </span>
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {tab === "backend" ? <BackendTab /> : <UsageTab />}
        </div>
      </div>
    </div>
  );
}

/** CLI 后端选择面板（反馈 #14）：列出已注册后端 + 探活 + 切换。 */
function BackendTab() {
  const backend = useApp((s) => s.backend);
  const backendList = useApp((s) => s.backendList);
  const setBackend = useApp((s) => s.setBackend);
  const loadBackend = useApp((s) => s.loadBackend);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await loadBackend();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <p className="text-[11px] leading-relaxed text-gray-500">
        切换 dazi 调用的 CLI 工具。当前已注册 {backendList.length} 个后端，
        选择后会影响 handoff / autopilot / 复盘 / 提炼 skill 等所有调用路径，
        持久化到 <code className="rounded bg-white/70 px-1">~/.dazi/config.json</code>。
      </p>
      <ModelProbeSection />
      <div className="flex justify-end">
        <button
          onClick={refresh}
          disabled={refreshing}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
            refreshing
              ? "cursor-not-allowed bg-white/60 text-gray-400"
              : "bg-accent/90 text-on-accent shadow-sm shadow-accent/20 hover:bg-accent"
          }`}
        >
          {refreshing ? "检测中…" : "重新探活"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {backendList.length === 0 && (
          <p className="text-xs text-gray-400">暂无后端，启动时自动检测。</p>
        )}
        {backendList.map((b) => {
          const active = backend === b.name;
          const available = b.version !== null;
          return (
            <button
              key={b.name}
              onClick={() => setBackend(b.name)}
              disabled={!available}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                active
                  ? "border-accent bg-accent-soft/60"
                  : "border-white/70 bg-white/70 hover:bg-white/90"
              } ${!available ? "opacity-60" : ""}`}
            >
              <div
                className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition ${
                  active
                    ? "border-accent bg-accent"
                    : "border-gray-300 bg-white"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {b.name}
                  </span>
                  {active && (
                    <span className="rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-on-accent">
                      当前
                    </span>
                  )}
                  {!available && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      未安装
                    </span>
                  )}
                  {b.supports_permission_mode && (
                    <span
                      title="支持 --permission-mode，代理模式开关可用"
                      className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600"
                    >
                      perm-mode
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-gray-500">
                  {b.bin}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  版本: {b.version ?? "—"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 模型可用检测（反馈 #15）：让用户填 endpoint/api_key 测连通性，
 *  通过的结果可作为 #14 后端切换的参考。 */
function ModelProbeSection() {
  const testModelConfig = useApp((s) => s.testModelConfig);
  const [provider, setProvider] = useState("anthropic");
  const [endpoint, setEndpoint] = useState("https://api.anthropic.com");
  const [model, setModel] = useState("claude-sonnet-4-5");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    latency_ms: number;
    prompt_tokens: number;
    completion_tokens: number;
    error_message: string | null;
    model_response: string | null;
    actual_model: string | null;
  } | null>(null);

  async function run() {
    if (!apiKey.trim() || !endpoint.trim() || !model.trim()) {
      setResult({
        success: false,
        latency_ms: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        error_message: "endpoint / model / api_key 都必填",
        model_response: null,
        actual_model: null,
      });
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const r = await testModelConfig({
        id: "probe-" + Date.now(),
        name: "probe",
        provider,
        endpoint,
        model,
        api_key: apiKey,
      });
      setResult(r);
    } catch (e: any) {
      setResult({
        success: false,
        latency_ms: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        error_message: String(e),
        model_response: null,
        actual_model: null,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/70 bg-white/60 p-3">
      <div className="mb-2 text-[12px] font-semibold text-gray-700">
        模型可用检测
        <span className="ml-2 text-[10px] font-normal text-gray-400">
          （整合 model-test 能力，dazi-core 复用同一份 reqwest 测试逻辑）
        </span>
      </div>
      <div className="grid grid-cols-[80px_1fr] items-center gap-x-2 gap-y-1.5 text-[11px]">
        <label className="text-gray-500">provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-md border border-white/60 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-accent-border"
        >
          <option value="anthropic">anthropic</option>
          <option value="openai">openai (兼容)</option>
        </select>
        <label className="text-gray-500">endpoint</label>
        <input
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://api.anthropic.com"
          className="rounded-md border border-white/60 bg-white/80 px-2 py-1 font-mono text-[12px] outline-none focus:border-accent-border"
        />
        <label className="text-gray-500">model</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="claude-sonnet-4-5"
          className="rounded-md border border-white/60 bg-white/80 px-2 py-1 font-mono text-[12px] outline-none focus:border-accent-border"
        />
        <label className="text-gray-500">api_key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-…"
          className="rounded-md border border-white/60 bg-white/80 px-2 py-1 font-mono text-[12px] outline-none focus:border-accent-border"
        />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={run}
          disabled={testing}
          className={`rounded-md px-3 py-1 text-[12px] font-medium transition ${
            testing
              ? "cursor-not-allowed bg-white/60 text-gray-400"
              : "bg-accent/90 text-on-accent shadow-sm shadow-accent/20 hover:bg-accent"
          }`}
        >
          {testing ? "检测中…" : "测试连通性"}
        </button>
      </div>
      {result && (
        <div
          className={`mt-2 rounded-md p-2 text-[11px] ${
            result.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.success ? (
            <>
              ✓ {result.latency_ms}ms · input{" "}
              {result.prompt_tokens} · output {result.completion_tokens}
              {result.actual_model && ` · 实际模型 ${result.actual_model}`}
              {result.model_response && (
                <div className="mt-1 truncate text-gray-600">
                  响应: {result.model_response}
                </div>
              )}
            </>
          ) : (
            <>✗ {result.error_message}</>
          )}
        </div>
      )}
    </div>
  );
}

/** 用量面板（反馈 #16）：按月聚合展示 token 消耗与估算费用。 */
function UsageTab() {
  const getUsage = useApp((s) => s.getUsage);
  const listUsageMonths = useApp((s) => s.listUsageMonths);
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("");
  const [entries, setEntries] = useState<
    {
      at: string;
      project_slug: string;
      model: string | null;
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
      cost_usd: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function refresh(m?: string) {
    setLoading(true);
    try {
      const ms = await listUsageMonths();
      setMonths(ms);
      const target = m ?? month ?? ms[0] ?? "";
      if (target) {
        setMonth(target);
        const data = await getUsage(target);
        setEntries(data.entries);
      } else {
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalInput = entries.reduce((s, e) => s + e.input_tokens, 0);
  const totalOutput = entries.reduce((s, e) => s + e.output_tokens, 0);
  const totalCacheC = entries.reduce(
    (s, e) => s + e.cache_creation_input_tokens,
    0
  );
  const totalCacheR = entries.reduce(
    (s, e) => s + e.cache_read_input_tokens,
    0
  );
  const totalCost = entries.reduce((s, e) => s + e.cost_usd, 0);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      <p className="text-[11px] leading-relaxed text-gray-500">
        每次 autopilot 执行后自动落盘 usage 到{" "}
        <code className="rounded bg-white/70 px-1">~/.dazi/usage/YYYY-MM.json</code>，
        按月聚合展示。费用按 anthropic 公开单价表估算（未知模型计 0）。
      </p>
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            refresh(e.target.value);
          }}
          className="rounded-md border border-white/60 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-accent-border"
        >
          {months.length === 0 && <option value="">暂无数据</option>}
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
            loading
              ? "cursor-not-allowed bg-white/60 text-gray-400"
              : "bg-accent/90 text-on-accent shadow-sm shadow-accent/20 hover:bg-accent"
          }`}
        >
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="input" value={totalInput.toLocaleString()} />
        <Stat label="output" value={totalOutput.toLocaleString()} />
        <Stat label="cache" value={(totalCacheC + totalCacheR).toLocaleString()} />
        <Stat label="费用 USD" value={`$${totalCost.toFixed(4)}`} />
      </div>
      <div className="overflow-hidden rounded-lg border border-white/70">
        <table className="w-full text-[11px]">
          <thead className="bg-white/70 text-left text-gray-500">
            <tr>
              <th className="px-2 py-1.5">时间</th>
              <th className="px-2 py-1.5">项目</th>
              <th className="px-2 py-1.5">模型</th>
              <th className="px-2 py-1.5 text-right">in</th>
              <th className="px-2 py-1.5 text-right">out</th>
              <th className="px-2 py-1.5 text-right">cache</th>
              <th className="px-2 py-1.5 text-right">USD</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-2 py-6 text-center text-gray-400"
                >
                  本月暂无 autopilot 执行记录。
                </td>
              </tr>
            ) : (
              entries
                .slice()
                .reverse()
                .map((e, i) => (
                  <tr
                    key={`${e.at}-${i}`}
                    className="border-t border-white/60 hover:bg-white/40"
                  >
                    <td className="px-2 py-1.5 font-mono text-gray-600">
                      {e.at.replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-2 py-1.5 text-gray-800">
                      {e.project_slug}
                    </td>
                    <td className="px-2 py-1.5 text-gray-500">
                      {e.model ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {e.input_tokens.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {e.output_tokens.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right text-gray-500">
                      {(
                        e.cache_creation_input_tokens +
                        e.cache_read_input_tokens
                      ).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      ${e.cost_usd.toFixed(4)}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/60 bg-white/70 p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-mono text-[14px] font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
}
