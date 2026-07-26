import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AuditReport, TenantId } from "@/types";

interface AuditorState {
  // The most recently generated report (consumed by /report).
  report: AuditReport | null;
  setReport: (r: AuditReport | null) => void;

  // Selected tenant - simulates multi-tenancy selection.
  tenantId: TenantId;
  setTenantId: (id: TenantId) => void;
}

const AuditorContext = createContext<AuditorState | null>(null);

export function AuditorProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [tenantId, setTenantId] = useState<TenantId>("company_a");

  return (
    <AuditorContext.Provider value={{ report, setReport, tenantId, setTenantId }}>
      {children}
    </AuditorContext.Provider>
  );
}

export function useAuditor() {
  const ctx = useContext(AuditorContext);
  if (!ctx) throw new Error("useAuditor must be used within AuditorProvider");
  return ctx;
}
