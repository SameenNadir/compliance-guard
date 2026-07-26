import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  FileText,
  BookOpen,
  ShieldCheck,
  Github,
} from "lucide-react";
import { classNames } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/auditor", label: "Code Auditor", icon: Code2 },
  { to: "/rulebook", label: "Rulebook", icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-800 bg-slate-900/40 backdrop-blur">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-800">
        <div className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-slate-100 text-[0.95rem]">ComplianceGuard</div>
          <div className="text-[0.7rem] text-slate-500 tracking-wide uppercase">AI Auditor</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                classNames(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent-500/10 text-accent-300 border border-accent-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                )
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <div className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="text-[0.7rem] text-slate-500 uppercase tracking-wide">Engine</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-xs text-slate-300">Gemini + Pinecone</span>
          </div>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300"
        >
          <Github className="w-3.5 h-3.5" /> v1.0.0 · weekend build
        </a>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              classNames(
                "flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium",
                isActive ? "text-accent-300" : "text-slate-500"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
