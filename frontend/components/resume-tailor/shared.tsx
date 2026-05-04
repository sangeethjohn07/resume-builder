import type { ReactNode } from "react";

export function Summary({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {count}
      </span>
    </div>
  );
}

export function Card({
  title,
  children,
  action,
  badge,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  badge?: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          {typeof badge === "number" && (
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
