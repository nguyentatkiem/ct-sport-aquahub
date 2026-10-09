import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { coSo } from "@/db/schema";
import { canDangNhap, dangXuat, phamViCoSo } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import { co } from "@/lib/permissions";
import { VAI_TRO } from "@/lib/labels";
import { Sidebar, BottomNav, LogoutButton, type NavItem } from "./nav";
import { CoSoPicker } from "./coso-picker";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await canDangNhap();
  const [cd, dsCoSo, chon] = await Promise.all([docCaiDat(), db.select().from(coSo).orderBy(asc(coSo.id)), phamViCoSo(u)]);
  const vt = u.vaiTro;
  const items: NavItem[] = [
    { href: "/admin", label: "Tổng quan", icon: "LayoutDashboard", nhom: "Vận hành" },
    { href: "/admin/checkin", label: "Check-in", icon: "ScanLine", nhom: "Vận hành" },
    { href: "/admin/khach", label: "Khách hàng", icon: "Users", nhom: "Vận hành" },
    { href: "/admin/sap-het", label: "Sắp hết hạn", icon: "AlarmClock", nhom: "Vận hành" },
    { href: "/admin/thu-tien", label: "Thu tiền & công nợ", icon: "Wallet", nhom: "Vận hành" },
    { href: "/admin/hom-nay", label: "Khách hôm nay", icon: "ClipboardList", nhom: "Vận hành" },
    ...(co(vt, "XEM_BAO_CAO") ? [{ href: "/admin/bao-cao", label: "Báo cáo", icon: "BarChart3", nhom: "Quản lý" }] : []),
    { href: "/admin/san-pham", label: "Sản phẩm", icon: "Package", nhom: "Quản lý" },
    ...(co(vt, "QUAN_LY_LOP_GV_QR")
      ? [
          { href: "/admin/lop", label: "Lớp học", icon: "GraduationCap", nhom: "Quản lý" },
          { href: "/admin/giao-vien", label: "Giáo viên", icon: "UserRound", nhom: "Quản lý" },
          { href: "/admin/qr", label: "Mã QR", icon: "QrCode", nhom: "Quản lý" },
        ]
      : []),
    { href: "/kiosk", label: "Chế độ ki-ốt", icon: "MonitorSmartphone", nhom: "Quản lý" },
    ...(co(vt, "NHAP_EXCEL") ? [{ href: "/admin/nhap-excel", label: "Nhập Excel", icon: "FileUp", nhom: "Hệ thống" }] : []),
    ...(co(vt, "QUAN_LY_TAI_KHOAN") ? [{ href: "/admin/nhan-vien", label: "Nhân viên", icon: "UserCog", nhom: "Hệ thống" }] : []),
    ...(co(vt, "CAI_DAT") ? [{ href: "/admin/cai-dat", label: "Cài đặt", icon: "Settings", nhom: "Hệ thống" }] : []),
    ...(co(vt, "XEM_NHAT_KY") ? [{ href: "/admin/nhat-ky", label: "Nhật ký", icon: "ScrollText", nhom: "Hệ thống" }] : []),
    { href: "/admin/tai-khoan", label: "Đổi mật khẩu", icon: "UserCog", nhom: "Hệ thống" },
  ];
  async function thoat() {
    "use server";
    await dangXuat();
    redirect("/login");
  }
  const logout = <LogoutButton action={thoat} ten={u.hoTen} vaiTro={VAI_TRO[vt]} />;
  const tenCoSoGan = dsCoSo.find((c) => c.id === u.coSoId)?.ten;
  return (
    <div className="flex min-h-dvh">
      <Sidebar items={items} tenTrungTam={cd.tenTrungTam} logout={logout} />
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-2 to-brand text-white">🏊</div>
            <span className="truncate font-extrabold">{cd.tenTrungTam}</span>
          </div>
          <div className="hidden text-sm text-ink-2 lg:block">
            Xin chào, <b className="text-ink">{u.hoTen}</b> · {VAI_TRO[vt]}
          </div>
          {vt === "CHU" ? (
            <CoSoPicker ds={dsCoSo.map((c) => ({ id: c.id, ten: c.ten }))} chon={chon} />
          ) : (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">{tenCoSoGan}</span>
          )}
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-5 pb-28 lg:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav items={items.filter((i) => !["/admin/checkin", "/admin/khach", "/admin/sap-het"].includes(i.href))} logout={logout} />
    </div>
  );
}
