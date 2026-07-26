import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import {
  Code2,
  Upload,
  Play,
  Building2,
  FileCode2,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, Button } from "@/components/ui";
import { useAuditor } from "@/state/AuditorContext";
import {
  TENANTS,
  runLocalAudit,
  SAMPLE_CODE_PYTHON,
  SAMPLE_CODE_JS,
  SAMPLE_CODE_GO,
} from "@/data/mockData";
import { classNames } from "@/lib/utils";

type Lang = "python" | "javascript" | "go";

const LANG_EXT: Record<Lang, string> = {
  python: ".py",
  javascript: ".js",
  go: ".go",
};

const LANG_LABEL: Record<Lang, string> = {
  python: "Python",
  javascript: "JavaScript",
  go: "Go",
};

// Map user-selected language to a default file name.
const DEFAULT_FILE: Record<Lang, string> = {
  python: "snippet.py",
  javascript: "snippet.js",
  go: "snippet.go",
};

function langExtension(lang: Lang) {
  if (lang === "python") return python();
  if (lang === "javascript") return javascript();
  return go();
}

type Phase = "idle" | "scanning" | "done";

export function AuditorPage() {
  const navigate = useNavigate();
  const { tenantId, setTenantId, setReport } = useAuditor();
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState<string>(SAMPLE_CODE_PYTHON);
  const [fileName, setFileName] = useState<string>(DEFAULT_FILE.python);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLangChange(next: Lang) {
    setLang(next);
    setFileName(DEFAULT_FILE[next]);
    // Only swap sample code if the editor still holds a sample. This avoids
    // clobbering pasted user code when they just change the language dropdown.
    if (
      code === SAMPLE_CODE_PYTHON ||
      code === SAMPLE_CODE_JS ||
      code === SAMPLE_CODE_GO ||
      code.trim() === ""
    ) {
      const sample = next === "python" ? SAMPLE_CODE_PYTHON : next === "javascript" ? SAMPLE_CODE_JS : SAMPLE_CODE_GO;
      setCode(sample);
    }
  }

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let nextLang: Lang = lang;
    if (ext === "py") nextLang = "python";
    else if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx") nextLang = "javascript";
    else if (ext === "go") nextLang = "go";
    else {
      setUploadMsg(`Unsupported extension ".${ext}". Use .py, .js, .ts, .go.`);
      return;
    }
    const text = await file.text();
    setLang(nextLang);
    setFileName(file.name);
    setCode(text);
    setUploadMsg(`Loaded ${file.name} (${text.length} chars)`);
    setShowPreview(true);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function runAudit() {
    if (!code.trim()) {
      setUploadMsg("Paste or upload some code before running the audit.");
      return;
    }
    setPhase("scanning");
    setUploadMsg(null);
    // Simulate the backend round-trip: embed code -> query Pinecone -> Gemini audit.
    await new Promise((r) => setTimeout(r, 1900));
    const report = runLocalAudit(tenantId, fileName, LANG_LABEL[lang], code);
    setReport(report);
    setPhase("done");
    // Brief success state, then navigate to the report.
    setTimeout(() => navigate("/report"), 450);
  }

  return (
    <div>
      <PageHeader
        title="Code Auditor"
        description="Submit a code snippet or file. ComplianceGuard embeds it, retrieves matching rules from the tenant's vector index, and generates a Gemini-backed audit report."
        breadcrumb={["ComplianceGuard", "Code Auditor"]}
        icon={<Code2 className="w-5 h-5" />}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
            Back
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 1: tenant selection */}
        <Card>
          <CardHeader
            title="1 · Select Tenant"
            subtitle="The audit runs only against the selected tenant's rulebook. Multi-tenant isolation is enforced via strict metadata filters."
            icon={<Building2 className="w-[18px] h-[18px]" />}
          />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TENANTS.map((t) => {
                const active = t.id === tenantId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTenantId(t.id)}
                    className={classNames(
                      "text-left rounded-xl border p-4 transition-all",
                      active
                        ? "border-accent-500/60 bg-accent-500/[0.08] ring-2 ring-accent-500/20"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={classNames("w-4 h-4", active ? "text-accent-400" : "text-slate-500")}
                        />
                        <span className="font-medium text-slate-100">{t.name}</span>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-accent-400" />}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {t.rulesCount} active rules · {t.plan}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Step 2: upload + editor */}
        <Card>
          <CardHeader
            title="2 · Provide Code"
            subtitle="Upload a file or paste directly into the editor below."
            icon={<FileCode2 className="w-[18px] h-[18px]" />}
            action={
              <div className="flex items-center gap-2">
                {/* Language selector */}
                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value as Lang)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="go">Go</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview((s) => !s)}>
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? "Hide" : "Show"}
                </Button>
              </div>
            }
          />

          <div className="px-5 pb-5 space-y-4">
            {/* Drop zone + uploader */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={classNames(
                "rounded-xl border-2 border-dashed p-5 text-center transition-all",
                dragOver
                  ? "border-accent-500/70 bg-accent-500/[0.06]"
                  : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
              )}
            >
              <Upload className="w-6 h-6 mx-auto text-slate-500" />
              <p className="text-sm text-slate-300 mt-2">
                Drag &amp; drop a file here, or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-accent-400 hover:text-accent-300 underline underline-offset-2"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports .py, .js, .ts, .go</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.js,.ts,.jsx,.tsx,.go,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {uploadMsg && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-accent-400" />
                  {uploadMsg}
                </span>
                <button onClick={() => setUploadMsg(null)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Code editor */}
            {showPreview && (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 font-mono">{fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] text-slate-500">{code.length} chars</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const s = lang === "python" ? SAMPLE_CODE_PYTHON : lang === "javascript" ? SAMPLE_CODE_JS : SAMPLE_CODE_GO;
                        setCode(s);
                        setFileName(`sample${LANG_EXT[lang]}`);
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Load sample
                    </Button>
                  </div>
                </div>
                <div className="h-[360px] overflow-auto">
                  <CodeMirror
                    value={code}
                    height="360px"
                    theme="dark"
                    extensions={[langExtension(lang)]}
                    onChange={(val) => setCode(val)}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: true,
                      highlightActiveLineGutter: true,
                      foldGutter: true,
                      autocompletion: false,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Step 3: run */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-100">3 · Run Compliance Audit</h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Embeds your code, queries <span className="text-accent-300">{tenantId}</span>'s rules with a strict metadata filter,
                and asks Gemini for a structured report.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {phase === "done" && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" /> Report ready
                </span>
              )}
              <Button
                size="lg"
                onClick={runAudit}
                disabled={phase === "scanning"}
              >
                {phase === "scanning" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Auditing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Run Compliance Audit
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Processing state visualization */}
          {phase === "scanning" && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-fade-in">
              <div className="space-y-2.5">
                {[
                  "Embedding code snippet with text-embedding-004",
                  "Querying Pinecone with filter {tenant_id: '" + tenantId + "'}",
                  "Retrieving matching compliance rules",
                  "Generating Gemini audit report",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span
                      className="grid place-items-center w-5 h-5 rounded-full"
                      style={{ animationDelay: `${i * 0.25}s` }}
                    >
                      <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
                    </span>
                    <span className="text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-accent-500 to-accent-300 rounded-full animate-pulse-soft" />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
