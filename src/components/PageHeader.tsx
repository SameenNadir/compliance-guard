import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={i === breadcrumb.length - 1 ? "text-slate-300" : ""}>{b}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="hidden sm:grid place-items-center w-10 h-10 rounded-xl bg-slate-800 text-accent-300 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
