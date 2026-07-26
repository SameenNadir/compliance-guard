import { useRef, useState } from "react";
import {
  BookOpen,
  Upload,
  Building2,
  FileText,
  Trash2,
  CheckCircle2,
  Loader2,
  FileCode2,
  ShieldCheck,
  X,
  Database,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, Button, Badge } from "@/components/ui";
import { TENANTS, rulesForTenant } from "@/data/mockData";
import { useAuditor } from "@/state/AuditorContext";
import { classNames, SEVERITY_STYLE } from "@/lib/utils";
import type { ComplianceRule } from "@/types";

interface UploadedDoc {
  id: string;
  name: string;
  sizeKb: number;
  tenantId: string;
  uploadedAt: string;
  chunkCount: number;
  status: "Indexed" | "Processing" | "Failed";
}

const SEED_DOCS: UploadedDoc[] = [
  {
    id: "doc-1",
    name: "soc2_cc6_controls.txt",
    sizeKb: 12.4,
    tenantId: "company_a",
    uploadedAt: "2025-07-12T10:00:00Z",
    chunkCount: 8,
    status: "Indexed",
  },
  {
    id: "doc-2",
    name: "iso_27001_annex_a.pdf",
    sizeKb: 48.7,
    tenantId: "company_a",
    uploadedAt: "2025-07-13T15:30:00Z",
    chunkCount: 16,
    status: "Indexed",
  },
  {
    id: "doc-3",
    name: "owasp_top_ten.pdf",
    sizeKb: 31.2,
    tenantId: "company_b",
    uploadedAt: "2025-07-10T09:00:00Z",
    chunkCount: 12,
    status: "Indexed",
  },
];

export function RulebookPage() {
  const { tenantId, setTenantId } = useAuditor();
  const [docs, setDocs] = useState<UploadedDoc[]>(SEED_DOCS);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRules = rulesForTenant(tenantId);
  const tenantDocs = docs.filter((d) => d.tenantId === tenantId);

  const filteredRules = activeRules.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.section.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  async function handleUpload(file: File) {
    if (!/\.(txt|pdf|md)$/i.test(file.name)) {
      setToast(`Unsupported file type. Use .txt, .pdf, or .md.`);
      return;
    }
    setUploading(true);
    // Simulate backend: load -> chunk -> embed -> upsert into tenant's namespace.
    await new Promise((r) => setTimeout(r, 1600));
    const chunkCount = Math.max(1, Math.round(file.size / 1024 / 2));
    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      sizeKb: Math.round(file.size / 1024 * 10) / 10,
      tenantId,
      uploadedAt: new Date().toISOString(),
      chunkCount,
      status: "Indexed",
    };
    setDocs((prev) => [newDoc, ...prev]);
    setUploading(false);
    setToast(`Indexed "${file.name}" for ${tenantId} (${chunkCount} chunks)`);
    setTimeout(() => setToast(null), 3500);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Rulebook Management"
        description="Upload compliance documents per tenant to populate the vector index. Uploaded docs are chunked, embedded, and tagged with the tenant_id metadata for strict isolation."
        breadcrumb={["ComplianceGuard", "Rulebook"]}
        icon={<BookOpen className="w-5 h-5" />}
        actions={
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700">
            <Database className="w-3 h-3" /> Pinecone
          </Badge>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tenant selector */}
        <Card>
          <CardHeader
            title="Active Tenant"
            subtitle="Uploads and the indexed rules list below are scoped to this tenant."
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
                      {rulesForTenant(t.id).length} rules · {t.plan}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Upload dropzone */}
        <Card>
          <CardHeader
            title="Upload Compliance Document"
            subtitle=".txt or .pdf. The backend chunks (512 tokens, 50 overlap), embeds with text-embedding-004, and upserts with metadata {tenant_id}."
            icon={<Upload className="w-[18px] h-[18px]" />}
          />
          <div className="px-5 pb-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={classNames(
                "rounded-xl border-2 border-dashed p-8 text-center transition-all",
                dragOver
                  ? "border-accent-500/70 bg-accent-500/[0.06]"
                  : "border-slate-800 bg-slate-900/30 hover:border-slate-700",
                uploading && "opacity-70 pointer-events-none"
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 text-accent-400 animate-spin" />
                  <p className="text-sm text-slate-300">Chunking, embedding, and upserting...</p>
                  <p className="text-xs text-slate-500">tenant_id={tenantId}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 mx-auto text-slate-500" />
                  <p className="text-sm text-slate-300 mt-2">
                    Drag &amp; drop a compliance document, or{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-accent-400 hover:text-accent-300 underline underline-offset-2"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">.txt, .pdf, .md</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.md"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                </>
              )}
            </div>

            {toast && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-200 animate-fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {toast}
                </span>
                <button onClick={() => setToast(null)} className="text-emerald-300/70 hover:text-emerald-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Indexed documents for this tenant */}
        <Card>
          <CardHeader
            title="Indexed Documents"
            subtitle={`${tenantDocs.length} document(s) indexed for this tenant`}
            icon={<FileText className="w-[18px] h-[18px]" />}
          />
          <div className="px-5 pb-5">
            {tenantDocs.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">
                No documents indexed yet. Upload one above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tenantDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 hover:border-slate-700 transition-all"
                  >
                    <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 text-accent-300 shrink-0">
                      <FileCode2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-100 truncate">{doc.name}</span>
                        <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> {doc.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{doc.sizeKb} KB</span>
                        <span>·</span>
                        <span>{doc.chunkCount} chunks</span>
                        <span>·</span>
                        <span>tenant_id={doc.tenantId}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDoc(doc.id)}
                      className="grid place-items-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Remove from index"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Active rules list */}
        <Card>
          <CardHeader
            title="Active Compliance Rules"
            subtitle={`${filteredRules.length} rule(s) currently enforced for this tenant`}
            icon={<ShieldCheck className="w-[18px] h-[18px]" />}
            action={
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rules..."
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                />
              </div>
            }
          />
          <div className="px-5 pb-5 space-y-2">
            {filteredRules.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">
                {query ? "No rules match your search." : "No active rules for this tenant."}
              </div>
            ) : (
              filteredRules.map((rule) => <RuleRow key={rule.id} rule={rule} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: ComplianceRule }) {
  const style = SEVERITY_STYLE[rule.severity];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-100">{rule.title}</span>
            <span className={classNames("text-xs font-mono px-1.5 py-0.5 rounded", style.chip)}>
              {rule.severity}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{rule.description}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono text-accent-400/80">{rule.reference}</span>
            <span>·</span>
            <span>{rule.section}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
