import type {
  AuditReport,
  ComplianceRule,
  DashboardMetrics,
  Finding,
  ScanRecord,
  Severity,
  Tenant,
  TenantId,
} from "@/types";

// ---------------------------------------------------------------------------
// Tenants - simulates multi-tenancy isolation
// ---------------------------------------------------------------------------
export const TENANTS: Tenant[] = [
  {
    id: "company_a",
    name: "Company A",
    plan: "Enterprise",
    rulesCount: 24,
    lastScanAt: "2025-07-17T14:22:00Z",
  },
  {
    id: "company_b",
    name: "Company B",
    plan: "Pro",
    rulesCount: 18,
    lastScanAt: "2025-07-16T09:11:00Z",
  },
  {
    id: "company_c",
    name: "Company C",
    plan: "Starter",
    rulesCount: 12,
    lastScanAt: "2025-07-15T17:45:00Z",
  },
];

// ---------------------------------------------------------------------------
// Compliance rules indexed per tenant
// ---------------------------------------------------------------------------
export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: "rule-1.1",
    tenantId: "company_a",
    section: "Access Control",
    reference: "SOC2-CC6.1",
    title: "Hardcoded Secrets Prohibition",
    description:
      "No source code may contain hardcoded passwords, API keys, tokens, or connection strings.",
    severity: "Critical",
  },
  {
    id: "rule-1.3",
    tenantId: "company_a",
    section: "Access Control",
    reference: "SOC2-CC6.1",
    title: "Multi-Factor Authentication Required",
    description: "Admin endpoints must require MFA. Single-factor access is prohibited.",
    severity: "High",
  },
  {
    id: "rule-2.1",
    tenantId: "company_a",
    section: "Data Protection",
    reference: "ISO-27001-A.8.24",
    title: "Encryption In Transit",
    description: "All public-network traffic must use TLS 1.2+. Plain HTTP is prohibited.",
    severity: "High",
  },
  {
    id: "rule-2.3",
    tenantId: "company_a",
    section: "Data Protection",
    reference: "ISO-27001-A.8.24",
    title: "No Sensitive Data In Logs",
    description: "Logs must never contain passwords, tokens, or full card numbers.",
    severity: "High",
  },
  {
    id: "rule-3.1",
    tenantId: "company_a",
    section: "Input Validation",
    reference: "SOC2-CC6.6",
    title: "SQL Injection Prevention",
    description: "All queries with user input must use parameterized statements.",
    severity: "Critical",
  },
  {
    id: "rule-3.2",
    tenantId: "company_a",
    section: "Input Validation",
    reference: "SOC2-CC6.6",
    title: "Command Injection Prevention",
    description: "User input must never reach os.system / shell=True / eval.",
    severity: "Critical",
  },
  {
    id: "rule-4.2",
    tenantId: "company_a",
    section: "Dependency Management",
    reference: "ISO-27001-A.8.28",
    title: "Pinned Dependency Versions",
    description: "Production deps must be pinned. Floating 'latest' tags are discouraged.",
    severity: "Medium",
  },
  {
    id: "rule-5.1",
    tenantId: "company_a",
    section: "Error Handling",
    reference: "SOC2-CC7.4",
    title: "No Verbose Error Messages",
    description: "Stack traces must not be returned to end users.",
    severity: "Medium",
  },
  {
    id: "rule-5.2",
    tenantId: "company_a",
    section: "Error Handling",
    reference: "SOC2-CC7.4",
    title: "Secure Exception Handling",
    description: "External input paths must be wrapped in try/except with sanitized output.",
    severity: "Low",
  },
  // Company B rules
  {
    id: "rule-1.1-b",
    tenantId: "company_b",
    section: "Access Control",
    reference: "SOC2-CC6.1",
    title: "Hardcoded Secrets Prohibition",
    description: "No hardcoded secrets in source.",
    severity: "Critical",
  },
  {
    id: "rule-3.1-b",
    tenantId: "company_b",
    section: "Input Validation",
    reference: "SOC2-CC6.6",
    title: "SQL Injection Prevention",
    description: "Parameterized queries required.",
    severity: "Critical",
  },
  {
    id: "rule-2.1-b",
    tenantId: "company_b",
    section: "Data Protection",
    reference: "ISO-27001-A.8.24",
    title: "Encryption In Transit",
    description: "TLS 1.2+ required for all traffic.",
    severity: "High",
  },
  // Company C rules
  {
    id: "rule-1.1-c",
    tenantId: "company_c",
    section: "Access Control",
    reference: "SOC2-CC6.1",
    title: "Hardcoded Secrets Prohibition",
    description: "No hardcoded secrets.",
    severity: "Critical",
  },
];

export function rulesForTenant(tenantId: TenantId): ComplianceRule[] {
  return COMPLIANCE_RULES.filter((r) => r.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Recent scans (dashboard table)
// ---------------------------------------------------------------------------
export const RECENT_SCANS: ScanRecord[] = [
  {
    id: "scan-001",
    repoOrFileName: "payments-service/api.py",
    tenantId: "company_a",
    tenantName: "Company A",
    status: "Failed",
    date: "2025-07-17T14:22:00Z",
    critical: 2,
    high: 1,
    medium: 1,
    low: 0,
    complianceScore: 62,
  },
  {
    id: "scan-002",
    repoOrFileName: "auth-service/login.js",
    tenantId: "company_a",
    tenantName: "Company A",
    status: "Passed",
    date: "2025-07-17T11:08:00Z",
    critical: 0,
    high: 0,
    medium: 1,
    low: 2,
    complianceScore: 94,
  },
  {
    id: "scan-003",
    repoOrFileName: "data-pipeline/etl.go",
    tenantId: "company_b",
    tenantName: "Company B",
    status: "Failed",
    date: "2025-07-16T09:11:00Z",
    critical: 1,
    high: 2,
    medium: 0,
    low: 1,
    complianceScore: 71,
  },
  {
    id: "scan-004",
    repoOrFileName: "frontend/utils.ts",
    tenantId: "company_b",
    tenantName: "Company B",
    status: "Passed",
    date: "2025-07-16T07:30:00Z",
    critical: 0,
    high: 0,
    medium: 0,
    low: 1,
    complianceScore: 98,
  },
  {
    id: "scan-005",
    repoOrFileName: "billing/invoice.py",
    tenantId: "company_c",
    tenantName: "Company C",
    status: "In Review",
    date: "2025-07-15T17:45:00Z",
    critical: 0,
    high: 1,
    medium: 2,
    low: 0,
    complianceScore: 81,
  },
  {
    id: "scan-006",
    repoOrFileName: "notifications/sender.py",
    tenantId: "company_a",
    tenantName: "Company A",
    status: "Passed",
    date: "2025-07-15T10:02:00Z",
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    complianceScore: 100,
  },
  {
    id: "scan-007",
    repoOrFileName: "storage/uploader.go",
    tenantId: "company_c",
    tenantName: "Company C",
    status: "Failed",
    date: "2025-07-14T22:15:00Z",
    critical: 1,
    high: 0,
    medium: 1,
    low: 1,
    complianceScore: 68,
  },
];

// ---------------------------------------------------------------------------
// Dashboard metrics derived from scans
// ---------------------------------------------------------------------------
export function computeDashboardMetrics(scans: ScanRecord[] = RECENT_SCANS): DashboardMetrics {
  const totalScans = scans.length;
  const openCritical = scans.reduce((s, x) => s + x.critical, 0);
  const openHigh = scans.reduce((s, x) => s + x.high, 0);
  const openMedium = scans.reduce((s, x) => s + x.medium, 0);
  const openLow = scans.reduce((s, x) => s + x.low, 0);
  const complianceScore = Math.round(
    scans.reduce((s, x) => s + x.complianceScore, 0) / Math.max(totalScans, 1)
  );
  return {
    totalScans,
    openCritical,
    openHigh,
    openMedium,
    openLow,
    complianceScore,
    scansTrend: [
      { label: "Mon", value: 3 },
      { label: "Tue", value: 5 },
      { label: "Wed", value: 4 },
      { label: "Thu", value: 7 },
      { label: "Fri", value: 6 },
      { label: "Sat", value: 2 },
      { label: "Sun", value: 1 },
    ],
  };
}

// ---------------------------------------------------------------------------
// The in-browser "audit engine" - pattern-matches the submitted code against
// the tenant's compliance rules and produces a realistic AuditReport.
// This simulates the Python backend's Gemini + Pinecone pipeline.
// ---------------------------------------------------------------------------
interface CodePattern {
  ruleId: string;
  ruleReference: string;
  ruleTitle: string;
  severity: Severity;
  match: RegExp;
  locationHint: (code: string, match: RegExpMatchArray) => string;
  offendingCode: (code: string, match: RegExpMatchArray) => string;
  explanation: string;
  remediation: string;
}

const CODE_PATTERNS: CodePattern[] = [
  {
    ruleId: "rule-1.1",
    ruleReference: "SOC2-CC6.1",
    ruleTitle: "Hardcoded Secrets Prohibition",
    severity: "Critical",
    match: /(password|passwd|pwd|api[_-]?key|secret|token)\s*=\s*["'][^"']+["']/i,
    locationHint: (code) => {
      const idx = code.search(/(password|passwd|pwd|api[_-]?key|secret|token)\s*=\s*["'][^"']+["']/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "A secret (password / API key / token) is assigned as a literal string directly in source. Anyone with read access to the repository can extract this credential, and it cannot be rotated without redeploying.",
    remediation:
      "Load the secret at runtime from a managed secret store.\n\n```python\nimport os\nDB_PASSWORD = os.environ[\"DB_PASSWORD\"]\n# or, prefer a secrets manager:\n# from vault_client import get_secret\n# DB_PASSWORD = get_secret(\"db/prod/password\")\n```\n\n**Never** commit the real value. Add the secret name to `.env.example` (name only, no value) so reviewers know it is required.",
  },
  {
    ruleId: "rule-3.1",
    ruleReference: "SOC2-CC6.6",
    ruleTitle: "SQL Injection Prevention",
    severity: "Critical",
    match: /(execute|query)\s*\(\s*["'`].*?\+\s*[\w.]+/i,
    locationHint: (code) => {
      const idx = code.search(/(execute|query)\s*\(\s*["'`].*?\+\s*[\w.]+/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "User input is concatenated directly into a SQL string before execution. An attacker can supply a crafted `user_id` like `1 OR 1=1` to bypass filters or exfiltrate data.",
    remediation:
      "Use a **parameterized query** so the driver treats user input as data, not SQL.\n\n```python\ncur.execute(\"SELECT * FROM users WHERE id = %s\", (user_id,))\n```\n\nFor JavaScript:\n```js\nawait db.query(\"SELECT * FROM users WHERE id = $1\", [userId]);\n```\n\nNever build SQL with string concatenation or f-strings containing user input.",
  },
  {
    ruleId: "rule-3.2",
    ruleReference: "SOC2-CC6.6",
    ruleTitle: "Command Injection Prevention",
    severity: "Critical",
    match: /(os\.system|subprocess\.(run|call|Popen)\([^)]*shell\s*=\s*True|eval\s*\()/i,
    locationHint: (code) => {
      const idx = code.search(/(os\.system|subprocess\.(run|call|Popen)\([^)]*shell\s*=\s*True|eval\s*\()/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "User-controlled input reaches a shell execution function. An attacker can chain shell metacharacters (`;`, `&&`, `$(...)`) to run arbitrary commands on the host.",
    remediation:
      "Pass arguments as a list with `shell=False` and validate input against an allowlist.\n\n```python\nimport subprocess\nresult = subprocess.run(\n    [\"grep\", pattern, file_path],   # argv list, no shell\n    shell=False,\n    capture_output=True,\n    text=True,\n)\n```\n\nIf you must use a shell, sanitize via `shlex.quote()` - but prefer `shell=False`.",
  },
  {
    ruleId: "rule-5.2",
    ruleReference: "SOC2-CC7.4",
    ruleTitle: "Secure Exception Handling",
    severity: "Low",
    match: /except\s*:|except\s+Exception\s*:\s*\n\s*pass/i,
    locationHint: (code) => {
      const idx = code.search(/except\s*:|except\s+Exception\s*:\s*\n\s*pass/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "A bare `except:` or `except: pass` silently swallows all errors, hiding failures and making incidents impossible to diagnose.",
    remediation:
      "Catch specific exception types and log the error.\n\n```python\ntry:\n    do_something()\nexcept SpecificError as exc:\n    logger.exception(\"do_something failed\")\n    raise  # or return a sanitized error to the caller\n```\n\nNever use bare `except:` or `except: pass`.",
  },
  {
    ruleId: "rule-2.3",
    ruleReference: "ISO-27001-A.8.24",
    ruleTitle: "No Sensitive Data In Logs",
    severity: "High",
    match: /print\s*\(\s*(password|secret|token|api[_-]?key|request\.headers)/i,
    locationHint: (code) => {
      const idx = code.search(/print\s*\(\s*(password|secret|token|api[_-]?key|request\.headers)/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "A sensitive variable or raw request headers are passed to `print` / a logger, which will be captured in log aggregation and exposed to anyone with log access.",
    remediation:
      "Log only non-sensitive identifiers and explicitly redact known sensitive fields.\n\n```python\nlogger.info(\"auth attempt\", {\"user\": user_id, \"success\": True})\n# never log: password, token, request.headers[\"authorization\"]\n```\n\nConsider a logging filter that masks fields named `password`, `token`, `ssn`.",
  },
  {
    ruleId: "rule-5.1",
    ruleReference: "SOC2-CC7.4",
    ruleTitle: "No Verbose Error Messages",
    severity: "Medium",
    match: /return\s+(str\s*\()?exc|raise\s+\w+\s*\(\s*f["']/i,
    locationHint: (code) => {
      const idx = code.search(/return\s+(str\s*\()?exc|raise\s+\w+\s*\(\s*f["']/i);
      return `Line ${idx >= 0 ? code.slice(0, idx).split("\n").length : "?"}`;
    },
    offendingCode: (_code, m) => m[0],
    explanation:
      "Internal exception details are surfaced to the caller, leaking stack traces, file paths, and library versions useful to an attacker.",
    remediation:
      "Log the full error internally; return a generic message to the user.\n\n```python\ntry:\n    risky()\nexcept Exception as exc:\n    logger.exception(\"risky failed\")\n    return {\"error\": \"internal error\", \"request_id\": req_id}\n```\n\nDo not echo `str(exc)` or full tracebacks in API responses.",
  },
];

export function runLocalAudit(
  tenantId: TenantId,
  fileName: string,
  language: string,
  code: string
): AuditReport {
  const tenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];
  const tenantRuleIds = new Set(rulesForTenant(tenantId).map((r) => r.id));

  const findings: Finding[] = [];
  let findingIdx = 0;

  for (const pattern of CODE_PATTERNS) {
    // Only report findings whose rule is active for this tenant.
    if (!tenantRuleIds.has(pattern.ruleId) && !tenantRuleIds.has(`${pattern.ruleId}-${tenantId.split("_")[1]}`)) {
      continue;
    }
    const matches = [...code.matchAll(new RegExp(pattern.match.source, pattern.match.flags.includes("g") ? pattern.match.flags : `${pattern.match.flags}g`))];
    for (const m of matches) {
      findings.push({
        id: `finding-${findingIdx++}`,
        severity: pattern.severity,
        ruleViolated: pattern.ruleTitle,
        ruleReference: pattern.ruleReference,
        location: pattern.locationHint(code, m),
        offendingCode: pattern.offendingCode(code, m),
        explanation: pattern.explanation,
        remediation: pattern.remediation,
      });
    }
  }

  const critical = findings.filter((f) => f.severity === "Critical").length;
  const high = findings.filter((f) => f.severity === "High").length;
  const medium = findings.filter((f) => f.severity === "Medium").length;
  const low = findings.filter((f) => f.severity === "Low").length;

  // Compliance score: start at 100, deduct per finding weighted by severity.
  const score = Math.max(
    0,
    100 - critical * 18 - high * 9 - medium * 4 - low * 1
  );

  const overallPosture =
    critical > 0 ? "Fail" : high > 0 ? "Needs Review" : "Pass";

  const summary =
    findings.length === 0
      ? `No compliance violations detected against ${tenant.name}'s rulebook. The submitted code follows current security and compliance standards. Maintain these practices in future changes.`
      : `Scan against ${tenant.name}'s rulebook identified ${findings.length} finding(s): ${critical} Critical, ${high} High, ${medium} Medium, ${low} Low. ${
          critical > 0
            ? "Critical issues must be remediated before merge."
            : high > 0
            ? "High-severity issues require review before deployment."
            : "Low-severity improvements recommended."
        } Overall compliance score: ${score}/100.`;

  return {
    id: `report-${Date.now()}`,
    tenantId,
    tenantName: tenant.name,
    fileName,
    language,
    scannedAt: new Date().toISOString(),
    overallPosture,
    summary,
    complianceScore: score,
    findings: findings.sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity)),
  };
}

function severityWeight(s: Severity): number {
  return { Critical: 0, High: 1, Medium: 2, Low: 3 }[s];
}

// ---------------------------------------------------------------------------
// Sample code snippets for the "Load Sample" button in the auditor
// ---------------------------------------------------------------------------
export const SAMPLE_CODE_PYTHON = `import os
import psycopg2

# Database credentials hardcoded directly in source - BAD PRACTICE
DB_HOST = "10.0.0.5"
DB_USER = "admin"
DB_PASSWORD = "SuperSecret123!"
DB_NAME = "production_db"

def get_user(user_id):
    # String-concatenated SQL - vulnerable to injection
    query = "SELECT * FROM users WHERE id = " + user_id
    conn = psycopg2.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME
    )
    cur = conn.cursor()
    cur.execute(query)
    return cur.fetchall()

def run_shell(cmd):
    # shell=True with user input - command injection risk
    os.system(cmd)

def debug_auth(token):
    print(token)
`;

export const SAMPLE_CODE_JS = `const express = require("express");
const app = express();

const API_KEY = "sk-live-9f8a7b6c5d4e3f2a1b0c";

app.get("/user/:id", (req, res) => {
  // String concatenation - SQL injection risk
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.query(query, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post("/run", (req, res) => {
  const { cmd } = req.body;
  eval(cmd);
});
`;

export const SAMPLE_CODE_GO = `package main

import (
  "fmt"
  "os/exec"
)

const Token = "ghp_abcdef1234567890"

func runCmd(input string) string {
  // shell execution of user input - command injection
  out, _ := exec.Command("sh", "-c", "echo " + input).Output()
  return string(out)
}

func main() {
  fmt.Println(runCmd("hello"))
}
`;
