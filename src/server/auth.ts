import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { kyToken, docToken } from "./jwt";
import { soMatKhau } from "./password";
export { bamMatKhau } from "./password";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { nguoiDung } from "@/db/schema";
import { co, type Quyen, type VaiTro } from "@/lib/permissions";
import { chuanSdt } from "@/lib/text";
import { ghiNhatKy } from "./audit";

const COOKIE = "cts_session";
const COOKIE_COSO = "cts_coso";

export type NguoiDungPhien = {
  id: number;
  hoTen: string;
  vaiTro: VaiTro;
  coSoId: number | null;
};

export class LoiQuyen extends Error {
  constructor(msg = "Bạn không có quyền thực hiện thao tác này") {
    super(msg);
  }
}

export async function thongTinYeuCau() {
  const h = await headers();
  return {
    ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null,
    thietBi: (h.get("user-agent") ?? "").slice(0, 200) || null,
  };
}

/** Đăng nhập bằng SĐT hoặc email (FR-HT-01). Sai 5 lần khoá 15 phút. */
export async function dangNhap(dinhDanh: string, matKhau: string): Promise<{ ok: true } | { ok: false; loi: string }> {
  const id = dinhDanh.trim().toLowerCase();
  const sdt = chuanSdt(id);
  const [u] = await db
    .select()
    .from(nguoiDung)
    .where(or(eq(nguoiDung.email, id), sdt.length >= 9 ? eq(nguoiDung.sdt, sdt) : eq(nguoiDung.email, id)));
  const loiChung = "SĐT/email hoặc mật khẩu không đúng";
  if (!u) return { ok: false, loi: loiChung };
  if (u.trangThai !== "HOAT_DONG") return { ok: false, loi: "Tài khoản đã bị khoá. Liên hệ Chủ trung tâm." };
  if (u.khoaDen && u.khoaDen > new Date()) {
    const phut = Math.ceil((u.khoaDen.getTime() - Date.now()) / 60000);
    return { ok: false, loi: `Đăng nhập sai quá 5 lần. Thử lại sau ${phut} phút.` };
  }
  const dung = await soMatKhau(matKhau, u.matKhauHash);
  const info = await thongTinYeuCau();
  if (!dung) {
    const lan = u.soLanSai + 1;
    await db
      .update(nguoiDung)
      .set(lan >= 5 ? { soLanSai: 0, khoaDen: new Date(Date.now() + 15 * 60000) } : { soLanSai: lan })
      .where(eq(nguoiDung.id, u.id));
    if (lan >= 5) {
      await ghiNhatKy(db, null, { module: "Hệ thống", hanhDong: "KHOA_DANG_NHAP", doiTuong: `ND${u.id}`, ...info });
      return { ok: false, loi: "Đăng nhập sai 5 lần. Tài khoản tạm khoá 15 phút." };
    }
    return { ok: false, loi: loiChung };
  }
  await db.update(nguoiDung).set({ soLanSai: 0, khoaDen: null }).where(eq(nguoiDung.id, u.id));
  const token = await kyToken({ uid: u.id, v: u.phienBan });
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600 });
  return { ok: true };
}

export async function dangXuat() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function layNguoiDung(): Promise<NguoiDungPhien | null> {
  const c = await cookies();
  const t = c.get(COOKIE)?.value;
  if (!t) return null;
  const p = await docToken<{ uid: number; v: number }>(t);
  if (!p) return null;
  const [u] = await db.select().from(nguoiDung).where(eq(nguoiDung.id, p.uid));
  if (!u || u.trangThai !== "HOAT_DONG" || u.phienBan !== p.v) return null;
  return { id: u.id, hoTen: u.hoTen, vaiTro: u.vaiTro as VaiTro, coSoId: u.coSoId };
}

export async function canDangNhap(): Promise<NguoiDungPhien> {
  const u = await layNguoiDung();
  if (!u) redirect("/login");
  return u;
}

export async function canQuyen(q: Quyen): Promise<NguoiDungPhien> {
  const u = await canDangNhap();
  if (!co(u.vaiTro, q)) throw new LoiQuyen();
  return u;
}

export function coQuyen(u: NguoiDungPhien, q: Quyen) {
  return co(u.vaiTro, q);
}

/**
 * Phạm vi cơ sở (D4). Chủ: theo bộ lọc đang chọn (null = tất cả). Quản lý/Lễ tân: luôn cơ sở được gán.
 */
export async function phamViCoSo(u: NguoiDungPhien): Promise<number | null> {
  if (u.vaiTro !== "CHU") return u.coSoId;
  const c = await cookies();
  const v = Number(c.get(COOKIE_COSO)?.value ?? 0);
  return v > 0 ? v : null;
}

export async function chonCoSo(id: number) {
  const c = await cookies();
  c.set(COOKIE_COSO, String(id), { path: "/", sameSite: "lax", maxAge: 365 * 86400 });
}

/** Cơ sở dùng cho thao tác ghi (bán, tạo khách…): Chủ phải chọn 1 cơ sở cụ thể. */
export async function coSoThaoTac(u: NguoiDungPhien, coSoYeuCau?: number | null): Promise<number> {
  if (u.vaiTro !== "CHU") return u.coSoId as number;
  const v = coSoYeuCau || (await phamViCoSo(u));
  if (!v) throw new LoiQuyen("Chọn một cơ sở cụ thể trước khi thao tác");
  return v;
}

/** Kiểm tra quyền truy cập dữ liệu của một cơ sở, ghi nhật ký nếu bị từ chối (TC-15). */
export async function kiemTraCoSo(u: NguoiDungPhien, coSoId: number, doiTuong?: string) {
  if (u.vaiTro === "CHU") return;
  if (u.coSoId === coSoId) return;
  const info = await thongTinYeuCau().catch(() => ({ ip: null, thietBi: null }));
  await ghiNhatKy(db, u, { module: "Phân quyền", hanhDong: "TU_CHOI_TRUY_CAP", doiTuong, giaTriMoi: { coSoId }, ...info });
  throw new LoiQuyen("Dữ liệu thuộc cơ sở khác, bạn không có quyền xem");
}
