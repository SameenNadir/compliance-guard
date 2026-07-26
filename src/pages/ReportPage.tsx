import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  Download,
  FileJson,
  ArrowLeft,
  Code2,
  Lightbulb,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, Button, EmptyState } from "@/components/ui";
import { MiniMarkdown } from "@/components/MiniMarkdown";
import { useAuditor } from "@/state/AuditorContext";
import { classNames, formatDateTime, SEVERITY_STYLE } from "@/lib/utils";
import type { Finding, Severity } from "@/types";
import jsPDF from "jspdf";

const SEVERITY_ICON: Record<Severity, typeof AlertOctagon> = {
  Critical: AlertOctagon,
  High: AlertTriangle,
  Medium: AlertCircle,
  Low: Info,
};

export function ReportPage() {
  const navigate = useNavigate();
  const { report } = useAuditor();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Expand all Critical findings by default.
    const s = new Set<string>();
    report?.findings.forEach((f) => {
      if (f.severity === "Critical") s.add(f.id);
    });
    return s;
  });

  if (!report) {
    return (
      <div>
        <PageHeader
          title="Audit Report"
          breadcrumb={["ComplianceGuard", "Report"]}
          icon={<FileText className="w-5 h-5" />}
        />
        <Card className="mx-4 sm:mx-6 lg:mx-8 my-6">
          <EmptyState
            icon={<ClipboardList className="w-7 h-7" />}
            title="No audit report yet"
            description="Run a compliance audit from the Code Auditor to generate a report here."
            action={
              <Button onClick={() => navigate("/auditor")}>
                <Code2 className="w-4 h-4" /> Go to Auditor
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  // Capture the non-null report so the closures below keep TS narrowing.
  const r = report;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = {
    Critical: r.findings.filter((f) => f.severity === "Critical").length,
    High: r.findings.filter((f) => f.severity === "High").length,
    Medium: r.findings.filter((f) => f.severity === "Medium").length,
    Low: r.findings.filter((f) => f.severity === "Low").length,
  };

  const postureStyle =
    r.overallPosture === "Pass"
      ? "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-200"
      : r.overallPosture === "Needs Review"
      ? "border-yellow-500/40 bg-yellow-500/[0.06] text-yellow-200"
      : "border-red-500/40 bg-red-500/[0.06] text-red-200";

  const PostureIcon = r.overallPosture === "Pass" ? ShieldCheck : ShieldAlert;

  function exportJSON() {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complianceguard-report-${r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    const ensure = (h: number) => {
      if (y + h > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    };
    const text = (str: string, size = 10, bold = false, color: [number, number, number] = [30, 41, 59]) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(str, width);
      lines.forEach((ln: string) => {
        ensure(size + 4);
        doc.text(ln, margin, y);
        y += size + 4;
      });
    };

    text("ComplianceGuard - Security Audit Report", 16, true, [99, 102, 241]);
    y += 6;
    text(`Tenant: ${r.tenantName} (${r.tenantId})`, 10, false, [71, 85, 105]);
    text(`File: ${r.fileName}`, 10, false, [71, 85, 105]);
    text(`Scanned: ${formatDateTime(r.scannedAt)}`, 10, false, [71, 85, 105]);
    text(`Posture: ${r.overallPosture}   Score: ${r.complianceScore}/100`, 10, true, [30, 41, 59]);
    y += 8;
    text("Summary", 12, true);
    text(r.summary, 10, false, [51, 65, 85]);
    y += 6;

    text(`Findings (${r.findings.length})`, 12, true);
    y += 4;
    r.findings.forEach((f, i) => {
      ensure(40);
      const sevColor: Record<Severity, [number, number, number]> = {
        Critical: [220, 38, 38],
        High: [234, 88, 12],
        Medium: [202, 138, 4],
        Low: [37, 99, 235],
      };
      text(`${i + 1}. [${f.severity}] ${f.ruleViolated} (${f.ruleReference})`, 11, true, sevColor[f.severity]);
      text(`Location: ${f.location}`, 9, false, [71, 85, 105]);
      text(`Explanation: ${f.explanation}`, 10, false, [51, 65, 85]);
      text("Offending code:", 9, true, [71, 85, 105]);
      text(f.offendingCode, 9, false, [71, 85, 105]);
      text("Remediation:", 9, true, [71, 85, 105]);
      // Strip markdown fences for the PDF plain-text version.
      const remed = f.remediation.replace(/```[\w]*\n?/g, "").replace(/```/g, "").replace(/\*\*/g, "");
      text(remed, 10, false, [51, 65, 85]);
      y += 6;
    });

    doc.save(`complianceguard-report-${r.id}.pdf`);
  }

  return (
    <div>
      <PageHeader
        title="Audit Report"
        description={`${r.fileName} · ${r.tenantName} · ${formatDateTime(r.scannedAt)}`}
        breadcrumb={["ComplianceGuard", "Code Auditor", "Report"]}
        icon={<FileText className="w-5 h-5" />}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate("/auditor")}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button variant="secondary" size="sm" onClick={exportJSON}>
              <FileJson className="w-3.5 h-3.5" /> JSON
            </Button>
            <Button size="sm" onClick={exportPDF}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary alert */}
        <div className={classNames("rounded-xl border p-5 animate-fade-in", postureStyle)}>
          <div className="flex items-start gap-3">
            <PostureIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold">
                  Overall Posture: {r.overallPosture}
                </h2>
                <span className="font-mono text-sm opacity-80">
                  Compliance Score: {r.complianceScore}/100
                </span>
              </div>
              <p className="text-sm mt-2 opacity-90 leading-relaxed">{r.summary}</p>
            </div>
          </div>
        </div>

        {/* Severity summary chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(counts) as Severity[]).map((sev) => {
            const Icon = SEVERITY_ICON[sev];
            const style = SEVERITY_STYLE[sev];
            return (
              <div key={sev} className={classNames("rounded-xl border p-4", style.card)}>
                <div className="flex items-center justify-between">
                  <Icon className={classNames("w-5 h-5", style.text)} />
                  <span className={classNames("text-2xl font-bold", style.text)}>{counts[sev]}</span>
                </div>
                <div className="text-sm text-slate-400 mt-2">{sev}</div>
              </div>
            );
          })}
        </div>

        {/* Findings list */}
        <Card>
          <CardHeader
            title={`Findings (${r.findings.length})`}
            subtitle="Each card expands to show the offending code and the recommended remediation."
            icon={<ClipboardList className="w-[18px] h-[18px]" />}
          />
          <div className="px-5 pb-5 space-y-3">
            {r.findings.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-7 h-7 text-emerald-400" />}
                title="No findings"
                description="The submitted code passed every rule in this tenant's rulebook."
              />
            ) : (
              r.findings.map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  isOpen={expanded.has(f.id)}
                  onToggle={() => toggle(f.id)}
                />
              ))
            )}
          </div>
        </Card>

        {/* Raw JSON preview (collapsible) */}
        <Card className="overflow-hidden">
          <details className="group">
            <summary className="cursor-pointer flex items-center justify-between px-5 py-4 text-sm text-slate-300 hover:bg-slate-800/30">
              <span className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-slate-500" />
                Raw report JSON (backend payload shape)
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
            </summary>
            <pre className="px-5 pb-5 text-xs font-mono text-slate-400 overflow-x-auto bg-slate-950/50">
              {JSON.stringify(r, null, 2)}
            </pre>
          </details>
        </Card>
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  isOpen,
  onToggle,
}: {
  finding: Finding;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const style = SEVERITY_STYLE[finding.severity];
  const Icon = SEVERITY_ICON[finding.severity];

  return (
    <div className={classNames("rounded-xl border overflow-hidden transition-all", style.card)}>
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/20 transition-colors"
      >
        <span className={classNames("grid place-items-center w-8 h-8 rounded-lg shrink-0", style.chip)}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={classNames("text-xs font-mono px-1.5 py-0.5 rounded", style.chip)}>
              {finding.severity}
            </span>
            <span className="font-semibold text-slate-100 truncate">{finding.ruleViolated}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="font-mono">{finding.ruleReference}</span>
            <span>·</span>
            <span>{finding.location}</span>
          </div>
        </div>
        <ChevronDown
          className={classNames(
            "w-4 h-4 text-slate-500 transition-transform shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-slate-800/50 pt-4">
          {/* Explanation */}
          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Info className="w-3.5 h-3.5" /> Explanation
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{finding.explanation}</p>
          </section>

          {/* Offending code */}
          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Code2 className="w-3.5 h-3.5" /> Offending Code
            </h4>
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] overflow-hidden">
              <div className="px-3 py-1.5 text-[0.7rem] font-mono text-red-300/70 border-b border-red-500/20">
                {finding.location}
              </div>
              <pre className="px-3 py-2.5 text-xs font-mono text-red-200 overflow-x-auto">
                <code>{finding.offendingCode}</code>
              </pre>
            </div>
          </section>

          {/* Remediation (markdown) */}
          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> Remediation
            </h4>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
              <MiniMarkdown content={finding.remediation} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
