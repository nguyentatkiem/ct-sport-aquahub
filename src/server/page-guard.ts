import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo, khachHang } from "@/db/schema";
import { canDangNhap, kiemTraCoSo, LoiQuyen, type NguoiDungPhien } from "./auth";

/** Tải khách và kiểm tra quyền cơ sở; trả về lỗi để trang tự hiển thị (không ném lỗi ra màn trắng). */
export async function taiKhachDuocXem(id: number): Promise<
  { ok: true; u: NguoiDungPhien; k: typeof khachHang.$inferSelect; cs: typeof coSo.$inferSelect } | { ok: false; loi: string }
> {
  const u = await canDangNhap();
  const [r] = await db.select({ k: khachHang, cs: coSo }).from(khachHang).innerJoin(coSo, eq(coSo.id, khachHang.coSoId)).where(eq(khachHang.id, id));
  if (!r) return { ok: false, loi: "Không tìm thấy khách" };
  try {
    await kiemTraCoSo(u, r.k.coSoId, r.k.maKh);
  } catch (e) {
    if (e instanceof LoiQuyen) return { ok: false, loi: e.message };
    throw e;
  }
  return { ok: true, u, k: r.k, cs: r.cs };
}
