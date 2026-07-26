import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ScanLine,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  TrendingUp,
  ArrowRight,
  Building2,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, Button, Badge } from "@/components/ui";
import { computeDashboardMetrics, RECENT_SCANS, TENANTS } from "@/data/mockData";
import { classNames, formatDate, relativeTime, STATUS_STYLE } from "@/lib/utils";

const SEVERITY_ICON = {
  Critical: AlertOctagon,
  High: AlertTriangle,
  Medium: AlertCircle,
  Low: Info,
} as const;

const SEVERITY_COLOR = {
  Critical: "text-red-400",
  High: "text-orange-400",
  Medium: "text-yellow-400",
  Low: "text-blue-400",
} as const;

export function DashboardPage() {
  const navigate = useNavigate();
  const metrics = computeDashboardMetrics();

  const sevCards = [
    { key: "Critical", label: "Critical", value: metrics.openCritical },
    { key: "High", label: "High", value: metrics.openHigh },
    { key: "Medium", label: "Medium", value: metrics.openMedium },
    { key: "Low", label: "Low", value: metrics.openLow },
  ] as const;

  const maxTrend = Math.max(...metrics.scansTrend.map((t) => t.value));

  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        description="Real-time security & compliance posture across all tenants."
        breadcrumb={["ComplianceGuard", "Dashboard"]}
        icon={<ShieldCheck className="w-5 h-5" />}
        actions={
          <Button onClick={() => navigate("/auditor")}>
            <ScanLine className="w-4 h-4" /> New Audit
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top metric row: total scans, compliance score, trend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Scans</div>
                <div className="text-3xl font-bold text-slate-100 mt-1">{metrics.totalScans}</div>
                <div className="text-xs text-slate-500 mt-1">across {TENANTS.length} tenants</div>
              </div>
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-accent-500/10 text-accent-300">
                <ScanLine className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-slate-400">Compliance Score</div>
                <div className="text-3xl font-bold text-slate-100 mt-1">
                  {metrics.complianceScore}
                  <span className="text-lg text-slate-500">/100</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-accent-500 rounded-full transition-all"
                    style={{ width: `${metrics.complianceScore}%` }}
                  />
                </div>
              </div>
              <div
                className={classNames(
                  "grid place-items-center w-12 h-12 rounded-xl",
                  metrics.complianceScore >= 85
                    ? "bg-emerald-500/10 text-emerald-300"
                    : metrics.complianceScore >= 70
                    ? "bg-yellow-500/10 text-yellow-300"
                    : "bg-red-500/10 text-red-300"
                )}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card hover className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-400">Scans This Week</div>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-end justify-between gap-1.5 h-16">
              {metrics.scansTrend.map((t) => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-accent-700 to-accent-400 transition-all hover:from-accent-600 hover:to-accent-300"
                    style={{ height: `${(t.value / maxTrend) * 100}%` }}
                    title={`${t.value} scans`}
                  />
                  <div className="text-[0.65rem] text-slate-500">{t.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Open vulnerabilities breakdown */}
        <Card>
          <CardHeader
            title="Open Vulnerabilities"
            subtitle="Aggregated across all tenants, grouped by severity"
            icon={<AlertTriangle className="w-[18px] h-[18px]" />}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 pb-5">
            {sevCards.map((s) => {
              const Icon = SEVERITY_ICON[s.key];
              return (
                <div
                  key={s.key}
                  className={classNames(
                    "rounded-xl border p-4 transition-all hover:scale-[1.02]",
                    s.key === "Critical" && "border-red-500/30 bg-red-500/[0.04]",
                    s.key === "High" && "border-orange-500/30 bg-orange-500/[0.04]",
                    s.key === "Medium" && "border-yellow-500/30 bg-yellow-500/[0.04]",
                    s.key === "Low" && "border-blue-500/30 bg-blue-500/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={classNames("w-5 h-5", SEVERITY_COLOR[s.key])} />
                    <span className={classNames("text-2xl font-bold", SEVERITY_COLOR[s.key])}>
                      {s.value}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mt-2">{s.label}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent scans table */}
        <Card>
          <CardHeader
            title="Recent Scans"
            subtitle="Latest code compliance audits across tenants"
            icon={<ScanLine className="w-[18px] h-[18px]" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate("/auditor")}>
                Run new <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-800">
                  <th className="px-5 py-3 font-medium">Repository / File</th>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Findings</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {RECENT_SCANS.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => navigate("/auditor")}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <CircleDot className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-medium text-slate-200">{scan.repoOrFileName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{scan.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge className={STATUS_STYLE[scan.status]}>{scan.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        {scan.critical > 0 && (
                          <span className="text-red-400">{scan.critical}C</span>
                        )}
                        {scan.high > 0 && (
                          <span className="text-orange-400">{scan.high}H</span>
                        )}
                        {scan.medium > 0 && (
                          <span className="text-yellow-400">{scan.medium}M</span>
                        )}
                        {scan.low > 0 && <span className="text-blue-400">{scan.low}L</span>}
                        {scan.critical + scan.high + scan.medium + scan.low === 0 && (
                          <span className="text-slate-500">none</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={classNames(
                          "font-mono font-semibold",
                          scan.complianceScore >= 85
                            ? "text-emerald-400"
                            : scan.complianceScore >= 70
                            ? "text-yellow-400"
                            : "text-red-400"
                        )}
                      >
                        {scan.complianceScore}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400" title={formatDate(scan.date)}>
                      {relativeTime(scan.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Tenant summary */}
        <Card>
          <CardHeader
            title="Tenants"
            subtitle="Multi-tenant isolation overview"
            icon={<Building2 className="w-[18px] h-[18px]" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 pb-5">
            {TENANTS.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent-400" />
                    <span className="font-medium text-slate-200">{t.name}</span>
                  </div>
                  <Badge className="bg-slate-800 text-slate-400 border border-slate-700">
                    {t.plan}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500">Active rules</div>
                    <div className="text-slate-200 font-semibold mt-0.5">{t.rulesCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Last scan</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      {relativeTime(t.lastScanAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
