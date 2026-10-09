// Nghiệp vụ trang khách (không đăng nhập): giải mã QR, tra cứu SĐT/mã khách có giới hạn, token chọn khách.
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { coSo, giaoVien, gioiHanTraCuu, khachHang, lopHoc, maQr, nguoiLienHe } from "@/db/schema";
import { chuanSdt, cheTen } from "@/lib/text";
import { kyToken, docToken } from "./jwt";

export async function giaiMaQr(token: string) {
  const [r] = await db
    .select({ qr: maQr, cs: coSo, lop: lopHoc, gv: giaoVien })
    .from(maQr)
    .innerJoin(coSo, eq(coSo.id, maQr.coSoId))
    .leftJoin(lopHoc, eq(lopHoc.id, maQr.lopHocId))
    .leftJoin(giaoVien, eq(giaoVien.id, lopHoc.giaoVienId))
    .where(eq(maQr.token, token));
  if (!r) return null;
  return {
    id: r.qr.id,
    hieuLuc: r.qr.trangThai === "HIEU_LUC" && r.cs.trangThai === "HOAT_DONG",
    loai: r.qr.loai,
    coSo: { id: r.cs.id, ten: r.cs.ten, diaChi: r.cs.diaChi, choTuDangKy: r.cs.choTuDangKy },
    lop: r.lop && r.lop.trangThai === "DANG_HOC" ? { id: r.lop.id, ten: r.lop.ten, lich: r.lop.lichText, giaoVien: r.gv?.hoTen ?? null } : null,
  };
}

/** NFR-06: tối đa `max` lần/phút cho mỗi khoá (thiết bị, IP). */
export async function vuotGioiHan(khoa: string, max = 10): Promise<boolean> {
  const phut = Math.floor(Date.now() / 60000);
  const r = await db.execute(sql`
    insert into gioi_han_tra_cuu (khoa, phut, so_lan) values (${khoa}, ${phut}, 1)
    on conflict (khoa, phut) do update set so_lan = gioi_han_tra_cuu.so_lan + 1
    returning so_lan`);
  if (Math.random() < 0.02) await db.delete(gioiHanTraCuu).where(sql`${gioiHanTraCuu.phut} < ${phut - 60}`);
  return Number((r.rows[0] as { so_lan: number }).so_lan) > max;
}

export type UngVien = { tok: string; tenChe: string; namSinh: string };

async function taoUngVien(rows: { id: number; hoTen: string; ngaySinh: string }[]): Promise<UngVien[]> {
  return Promise.all(
    rows.map(async (r) => ({ tok: await kyToken({ k: r.id, p: "pick" }, "10m"), tenChe: cheTen(r.hoTen), namSinh: r.ngaySinh.slice(0, 4) })),
  );
}

const DANG_DUNG = and(isNull(khachHang.gopVaoId), ne(khachHang.trangThai, "NGUNG"));

export type KetQuaTraCuu =
  | { buoc: "chon"; ungVien: UngVien[] }
  | { buoc: "can_4_so" }
  | { buoc: "khong_thay" }
  | { buoc: "sai_4_so" };

/** Nhận diện bằng SĐT, hoặc mã khách + 4 số cuối SĐT (FR-CI-02). */
export async function traCuuKhach(q: string, bonSoCuoi?: string | null): Promise<KetQuaTraCuu> {
  const raw = q.trim().toUpperCase().replace(/\s+/g, "");
  const laMa = /^[A-Z]{2}\d{3,}$/.test(raw);
  if (laMa) {
    const [k] = await db
      .select({ id: khachHang.id, hoTen: khachHang.hoTen, ngaySinh: khachHang.ngaySinh, sdt: khachHang.sdt, sdtLh: nguoiLienHe.sdt })
      .from(khachHang)
      .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
      .where(and(eq(khachHang.maKh, raw), DANG_DUNG));
    if (!k) return { buoc: "khong_thay" };
    const b4 = chuanSdt(bonSoCuoi);
    if (b4.length !== 4) return { buoc: "can_4_so" };
    const hop = [k.sdt, k.sdtLh].some((s) => !!s && chuanSdt(s).endsWith(b4));
    if (!hop) return { buoc: "sai_4_so" };
    return { buoc: "chon", ungVien: await taoUngVien([k]) };
  }
  const sdt = chuanSdt(raw);
  if (sdt.length < 9) return { buoc: "khong_thay" };
  const rows = await db
    .select({ id: khachHang.id, hoTen: khachHang.hoTen, ngaySinh: khachHang.ngaySinh })
    .from(khachHang)
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .where(and(DANG_DUNG, or(eq(khachHang.sdt, sdt), eq(nguoiLienHe.sdt, sdt))))
    .orderBy(khachHang.ngaySinh)
    .limit(10);
  if (!rows.length) return { buoc: "khong_thay" };
  return { buoc: "chon", ungVien: await taoUngVien(rows) };
}

/** Giải token chọn khách (10 phút) hoặc token nhớ trên máy (1 năm). */
export async function giaiTokenKhach(tok: string): Promise<number | null> {
  const p = await docToken<{ k: number; p: string }>(tok);
  if (!p || (p.p !== "pick" && p.p !== "remember")) return null;
  return p.k;
}

export async function tokenNho(khachId: number) {
  return kyToken({ k: khachId, p: "remember" }, "365d");
}

export async function timKhachTheoQrCaNhan(token: string) {
  const [k] = await db.select({ id: khachHang.id }).from(khachHang).where(and(eq(khachHang.qrToken, token), DANG_DUNG));
  return k?.id ?? null;
}

export async function timKhachTheoMa(ma: string) {
  const [k] = await db.select({ id: khachHang.id }).from(khachHang).where(and(eq(khachHang.maKh, ma.trim().toUpperCase()), DANG_DUNG));
  return k?.id ?? null;
}
