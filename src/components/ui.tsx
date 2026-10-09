import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export { clsx as cx };

type Tone = "brand" | "ok" | "warn" | "bad" | "muted" | "violet";

const toneBadge: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  muted: "bg-surface-2 text-ink-2 ring-1 ring-line",
  violet: "bg-violet-soft text-violet",
};

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", toneBadge[tone], className)}>{children}</span>;
}

const btn = {
  primary: "bg-gradient-to-r from-brand-2 to-brand text-white shadow-sm hover:brightness-105",
  secondary: "bg-white text-ink ring-1 ring-line hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2",
  danger: "bg-bad text-white hover:brightness-105",
  ok: "bg-ok text-white hover:brightness-105",
  warn: "bg-warn text-white hover:brightness-105",
};
const btnSize = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-[15px]", lg: "h-14 px-6 text-lg" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...p
}: ComponentProps<"button"> & { variant?: keyof typeof btn; size?: keyof typeof btnSize }) {
  return (
    <button
      {...p}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        btn[variant],
        btnSize[size],
        className,
      )}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: keyof typeof btn; size?: keyof typeof btnSize }) {
  return <Link {...p} className={clsx("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition", btn[variant], btnSize[size], className)} />;
}

export function Card({ className, children, ...p }: ComponentProps<"div">) {
  return (
    <div {...p} className={clsx("min-w-0 rounded-[var(--radius)] bg-surface shadow-[0_1px_2px_rgba(15,42,95,.05),0_4px_16px_rgba(15,42,95,.04)] ring-1 ring-line/70", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, sub }: { title: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
      <div>
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {sub && <p className="text-xs text-ink-3">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-[28px]">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-2">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "brand", icon }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {icon && <div className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", toneBadge[tone])}>{icon}</div>}
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink-2">{label}</div>
          <div className="tabular mt-0.5 text-2xl font-extrabold text-ink">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-ink-3">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

export function Field({ label, hint, error, required, children, className }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-bad"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-bad">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink placeholder:text-ink-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-surface-2";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input {...p} className={clsx(inputCls, "h-11", className)} />;
}
export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select {...p} className={clsx(inputCls, "h-11 pr-8", className)} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea {...p} className={clsx(inputCls, "min-h-20 py-2", className)} />;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full min-w-max border-collapse text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx("border-b border-line bg-surface-2 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-2 uppercase", className)}>{children}</th>;
}
export function Td({ children, className, colSpan, title }: { children?: ReactNode; className?: string; colSpan?: number; title?: string }) {
  return (
    <td colSpan={colSpan} title={title} className={clsx("border-b border-line/70 px-3 py-2.5 align-middle text-ink", className)}>
      {children}
    </td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-ink-3">{children}</div>;
}

export function Alert({ tone = "brand", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl px-3.5 py-2.5 text-sm", toneBadge[tone], className)}>{children}</div>;
}

export function Tabs({ items, active }: { items: { href: string; label: ReactNode; key: string }[]; active: string }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-line">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          className={clsx(
            "rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition",
            active === i.key ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
