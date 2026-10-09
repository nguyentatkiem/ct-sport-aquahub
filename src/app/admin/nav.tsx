"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  AlarmClock,
  Wallet,
  BarChart3,
  Package,
  GraduationCap,
  UserRound,
  QrCode,
  Settings,
  Search,
  Plus,
  MonitorSmartphone,
  FileUp,
  ScrollText,
  UserCog,
  Building2,
  X,
  LogOut,
  ClipboardList,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: string; nhom?: string };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ScanLine,
  Users,
  AlarmClock,
  Wallet,
  BarChart3,
  Package,
  GraduationCap,
  UserRound,
  QrCode,
  Settings,
  MonitorSmartphone,
  FileUp,
  ScrollText,
  UserCog,
  Building2,
  ClipboardList,
};

function laActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/");
}

export function Sidebar({ items, tenTrungTam, logout }: { items: NavItem[]; tenTrungTam: string; logout: React.ReactNode }) {
  const path = usePathname();
  let nhomTruoc: string | undefined;
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-4">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-2 to-brand text-xl text-white">🏊</div>
        <div className="leading-tight">
          <div className="font-extrabold text-ink">{tenTrungTam}</div>
          <div className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">Quản lý khách</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {items.map((it) => {
          const Icon = ICONS[it.icon] ?? LayoutDashboard;
          const on = laActive(path, it.href);
          const tieuDe = it.nhom && it.nhom !== nhomTruoc ? it.nhom : null;
          nhomTruoc = it.nhom;
          return (
            <div key={it.href}>
              {tieuDe && <div className="mt-4 mb-1 px-3 text-[11px] font-bold tracking-wider text-ink-3 uppercase">{tieuDe}</div>}
              <Link
                href={it.href}
                className={clsx(
                  "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition",
                  on ? "bg-gradient-to-r from-brand-2 to-brand text-white shadow-sm" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="size-5" />
                {it.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">{logout}</div>
    </aside>
  );
}

/** Thanh dưới cho điện thoại (mục 8.3): Check-in, Tìm khách, Sắp hết, Thêm. */
export function BottomNav({ items, logout }: { items: NavItem[]; logout: React.ReactNode }) {
  const path = usePathname();
  const [mo, setMo] = useState(false);
  const chinh = [
    { href: "/admin/checkin", label: "Check-in", Icon: ScanLine },
    { href: "/admin/khach", label: "Tìm khách", Icon: Search },
    { href: "/admin/sap-het", label: "Sắp hết", Icon: AlarmClock },
  ];
  return (
    <>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {chinh.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={clsx("flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold", laActive(path, href) ? "text-brand" : "text-ink-2")}>
            <Icon className="size-6" />
            {label}
          </Link>
        ))}
        <button onClick={() => setMo(true)} className="flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-ink-2">
          <Plus className="size-6" />
          Thêm
        </button>
      </nav>
      {mo && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMo(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-bold">Chức năng</div>
              <button onClick={() => setMo(false)} className="grid size-10 place-items-center rounded-full bg-surface-2" aria-label="Đóng">
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Link href="/admin/khach/moi" onClick={() => setMo(false)} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white">
                <Plus className="size-5" /> Thêm khách mới
              </Link>
              {items.map((it) => {
                const Icon = ICONS[it.icon] ?? LayoutDashboard;
                return (
                  <Link key={it.href} href={it.href} onClick={() => setMo(false)} className="flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink ring-1 ring-line">
                    <Icon className="size-5 text-brand" />
                    {it.label}
                  </Link>
                );
              })}
            </div>
            {logout}
          </div>
        </div>
      )}
    </>
  );
}

export function LogoutButton({ action, ten, vaiTro }: { action: () => void; ten: string; vaiTro: string }) {
  return (
    <form action={action} className="flex items-center justify-between gap-2">
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-bold">{ten}</div>
        <div className="text-xs text-ink-3">{vaiTro}</div>
      </div>
      <button className="flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-ink-2 ring-1 ring-line hover:bg-surface-2">
        <LogOut className="size-4" /> Thoát
      </button>
    </form>
  );
}
