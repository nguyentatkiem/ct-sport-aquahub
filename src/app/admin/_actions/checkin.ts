"use server";
import { and, eq, isNull, ne, or, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { coSo, khachHang, nguoiLienHe } from "@/db/schema";
import { canDangNhap, coSoThaoTac, phamViCoSo } from "@/server/auth";
import { thucHienCheckIn, vuotChan, type KetQuaView } from "@/server/checkin";
import { chay, type KetQuaAction } from "@/server/action";
import { chuanSdt, khongDau } from "@/lib/text";

export type KhachNhanh = { id: number; maKh: string; hoTen: string; ngaySinh: string; coSo: string; coSoId: number; trangThai: string; sdt: string | null };

/** Tìm nhanh: cơ sở mình theo tên/SĐT/mã; cơ sở khác chỉ khớp chính xác mã hoặc SĐT (mục 3.2). */
export async function timKhachNhanh(q: string): Promise<KhachNhanh[]> {
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const s = q.trim();
  if (s.length < 2) return [];
  const kd = khongDau(s);
  const sdt = chuanSdt(s);
  const ma = s.toUpperCase();
  const cuaMinh = and(
    cs ? eq(khachHang.coSoId, cs) : undefined,
    or(ilike(khachHang.timKiem, `%${kd}%`), sdt.length >= 4 ? ilike(khachHang.timKiem, `%${sdt}%`) : undefined),
  );
  const chinhXac = or(eq(khachHang.maKh, ma), sdt.length >= 9 ? or(eq(khachHang.sdt, sdt), eq(nguoiLienHe.sdt, sdt)) : undefined);
  return db
    .select({ id: khachHang.id, maKh: khachHang.maKh, hoTen: khachHang.hoTen, ngaySinh: khachHang.ngaySinh, coSo: coSo.ten, coSoId: khachHang.coSoId, trangThai: khachHang.trangThai, sdt: sql<string | null>`coalesce(${khachHang.sdt}, ${nguoiLienHe.sdt})` })
    .from(khachHang)
    .innerJoin(coSo, eq(coSo.id, khachHang.coSoId))
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .where(and(isNull(khachHang.gopVaoId), ne(khachHang.trangThai, "NGUNG"), or(cuaMinh, chinhXac)))
    .orderBy(khachHang.hoTen)
    .limit(20);
}

export async function checkInHoAction(khachHangId: number, lopHocId: number | null, coSoId?: number | null): Promise<KetQuaAction<KetQuaView>> {
  return chay(async () => {
    const u = await canDangNhap();
    const cs = await coSoThaoTac(u, coSoId);
    const r = await thucHienCheckIn({ khachHangId, coSoId: cs, lopHocId, kenh: "LE_TAN", nguoiThaoTac: u });
    revalidatePath("/admin/checkin");
    return r;
  });
}

export async function vuotChanAction(checkInId: number, lyDo: string): Promise<KetQuaAction<KetQuaView>> {
  return chay(async () => {
    const u = await canDangNhap();
    const r = await vuotChan({ checkInId, lyDo, user: u });
    revalidatePath("/admin/checkin");
    revalidatePath("/admin");
    return r;
  });
}
