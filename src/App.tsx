import { Routes, Route } from "react-router-dom";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { AuditorPage } from "@/pages/AuditorPage";
import { ReportPage } from "@/pages/ReportPage";
import { RulebookPage } from "@/pages/RulebookPage";
import { AuditorProvider } from "@/state/AuditorContext";

export default function App() {
  return (
    <AuditorProvider>
      <div className="flex min-h-screen bg-slate-950 bg-grid">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/auditor" element={<AuditorPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/rulebook" element={<RulebookPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
        <MobileNav />
      </div>
    </AuditorProvider>
  );
}
