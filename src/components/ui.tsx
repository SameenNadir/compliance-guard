import { type ReactNode } from "react";
import { classNames } from "@/lib/utils";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur",
        hover && "transition-all hover:border-slate-700 hover:bg-slate-900/70",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 pb-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 text-accent-300 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-100 leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary:
      "bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20 disabled:bg-accent-700/40 disabled:shadow-none",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 disabled:opacity-50",
    ghost: "hover:bg-slate-800 text-slate-300 disabled:opacity-50",
    danger:
      "bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-600/20 disabled:opacity-50",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all",
        "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:ring-offset-2 focus:ring-offset-slate-950",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-slate-800/60 text-slate-500 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
