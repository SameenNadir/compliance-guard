// Core domain types for ComplianceGuard

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type TenantId = "company_a" | "company_b" | "company_c";

export interface Tenant {
  id: TenantId;
  name: string;
  plan: "Enterprise" | "Pro" | "Starter";
  rulesCount: number;
  lastScanAt: string;
}

export interface ComplianceRule {
  id: string;
  tenantId: TenantId;
  section: string;
  reference: string; // e.g. "SOC2-CC6.1" or "ISO-27001-A.8.24"
  title: string;
  description: string;
  severity: Severity;
}

export type ScanStatus = "Passed" | "Failed" | "In Review";

export interface ScanRecord {
  id: string;
  repoOrFileName: string;
  tenantId: TenantId;
  tenantName: string;
  status: ScanStatus;
  date: string; // ISO
  critical: number;
  high: number;
  medium: number;
  low: number;
  complianceScore: number;
}

export interface Finding {
  id: string;
  severity: Severity;
  ruleViolated: string;
  ruleReference: string;
  location: string; // e.g. "Line 8" or "db.py:12"
  offendingCode: string;
  explanation: string;
  remediation: string; // markdown
}

export interface AuditReport {
  id: string;
  tenantId: TenantId;
  tenantName: string;
  fileName: string;
  language: string;
  scannedAt: string;
  overallPosture: "Pass" | "Fail" | "Needs Review";
  summary: string;
  complianceScore: number;
  findings: Finding[];
}

export interface DashboardMetrics {
  totalScans: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  complianceScore: number;
  scansTrend: { label: string; value: number }[];
}
