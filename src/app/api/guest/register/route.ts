import { giaiMaQr, vuotGioiHan } from "@/server/guest";
import { taoKhach } from "@/server/customers";
import { json, khoaThietBi } from "@/server/http";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string | boolean | null>;
  const qr = await giaiMaQr(String(b.qr ?? ""));
  if (!qr || !qr.hieuLuc) return json({ loi: "QR_HET_HIEU_LUC" }, 410);
  if (!qr.coSo.choTuDangKy) return json({ loi: "DONG_DANG_KY" }, 403);
  const { dev, ip } = await khoaThietBi();
  if ((await vuotGioiHan("reg:" + dev, 3)) || (await vuotGioiHan("regip:" + ip, 20))) return json({ loi: "QUA_NHIEU" }, 429);
  if (!b.dongY) return json({ loi: "Cần đồng ý xử lý dữ liệu" }, 400);
  try {
    const k = await taoKhach(
      {
        hoTen: String(b.hoTen ?? "").slice(0, 80),
        ngaySinh: String(b.ngaySinh ?? ""),
        sdt: b.sdt ? String(b.sdt) : null,
        lienHe: b.phHoTen ? { hoTen: String(b.phHoTen).slice(0, 80), sdt: String(b.phSdt ?? ""), quanHe: String(b.phQuanHe ?? "KHAC") } : null,
        coSoId: qr.coSo.id,
        khoaHocMuonDangKyId: b.sanPhamId ? Number(b.sanPhamId) || null : null,
        dongYDuLieu: true,
      },
      { nguonTao: "KHACH_TU_DANG_KY", user: null },
    );
    return json({ maKh: k.maKh });
  } catch (e) {
    return json({ loi: (e as Error).message }, 400);
  }
}
