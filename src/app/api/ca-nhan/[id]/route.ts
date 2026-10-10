// NFR-08: xuất toàn bộ dữ liệu của 1 khách khi có yêu cầu (JSON). Chủ, Quản lý cơ sở của khách. Có ghi nhật ký.
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { checkIn, donHang, ghiDanh, khachHang, nguoiLienHe, phieuThu, theVe } from "@/db/schema";
import { kiemTraCoSo, layNguoiDung, LoiQuyen, thongTinYeuCau } from "@/server/auth";
import { co } from "@/lib/permissions";
import { ghiNhatKy } from "@/server/audit";
import { json } from "@/server/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await layNguoiDung();
  if (!u) return json({ loi: "Chưa đăng nhập" }, 401);
  if (!co(u.vaiTro, "XUAT_EXCEL")) return json({ loi: "Không có quyền" }, 403);
  const [k] = await db.select().from(khachHang).where(eq(khachHang.id, Number(id)));
  if (!k) return json({ loi: "Không tìm thấy" }, 404);
  try {
    await kiemTraCoSo(u, k.coSoId, k.maKh);
  } catch (e) {
    if (e instanceof LoiQuyen) return json({ loi: e.message }, 403);
    throw e;
  }
  const [lh] = k.nguoiLienHeId ? await db.select().from(nguoiLienHe).where(eq(nguoiLienHe.id, k.nguoiLienHeId)) : [];
  const { qrToken: _qr, timKiem: _tk, ...hoSo } = k;
  void _qr;
  void _tk;
  const data = {
    xuatLuc: new Date().toISOString(),
    hoSo,
    nguoiLienHe: lh ?? null,
    theVe: await db.select().from(theVe).where(eq(theVe.khachHangId, k.id)),
    ghiDanh: await db.select().from(ghiDanh).where(eq(ghiDanh.khachHangId, k.id)),
    donHang: await db.select().from(donHang).where(eq(donHang.khachHangId, k.id)),
    phieuThu: await db.select().from(phieuThu).where(eq(phieuThu.khachHangId, k.id)),
    checkIn: await db
      .select({ thoiGian: checkIn.thoiGian, coSoId: checkIn.coSoId, ketQua: checkIn.ketQua, lyDo: checkIn.lyDoText, kenh: checkIn.kenh })
      .from(checkIn)
      .where(or(eq(checkIn.khachHangId, k.id))),
  };
  await ghiNhatKy(db, u, { module: "Dữ liệu cá nhân", hanhDong: "XUAT_DU_LIEU_CA_NHAN", doiTuong: k.maKh, coSoId: k.coSoId, ...(await thongTinYeuCau()) });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="du-lieu-${k.maKh}.json"`,
      "cache-control": "no-store",
    },
  });
}
