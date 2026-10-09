import { layNguoiDung, phamViCoSo } from "@/server/auth";
import { thucHienCheckIn } from "@/server/checkin";
import { timKhachTheoMa, timKhachTheoQrCaNhan } from "@/server/guest";
import { json } from "@/server/http";

/** Ki-ốt tại quầy (FR-CI-08): máy tính bảng đã đăng nhập nhân viên. Nhận QR cá nhân (/q/<token>) hoặc mã khách. */
export async function POST(req: Request) {
  const u = await layNguoiDung();
  if (!u) return json({ loi: "Ki-ốt chưa đăng nhập" }, 401);
  const b = (await req.json().catch(() => ({}))) as { code?: string; coSoId?: number };
  const coSoId = u.vaiTro === "CHU" ? Number(b.coSoId) || (await phamViCoSo(u)) : u.coSoId;
  if (!coSoId) return json({ loi: "Chọn cơ sở cho ki-ốt" }, 400);
  const code = String(b.code ?? "").trim();
  const m = code.match(/\/q\/([A-Za-z0-9]{10,})/);
  const khachId = m ? await timKhachTheoQrCaNhan(m[1]) : /^[A-Za-z]{2}\d{3,}$/.test(code) ? await timKhachTheoMa(code) : await timKhachTheoQrCaNhan(code);
  if (!khachId) return json({ loi: m ? "Mã QR không hợp lệ hoặc đã được cấp lại" : "Không tìm thấy mã khách" }, 404);
  const r = await thucHienCheckIn({ khachHangId: khachId, coSoId, kenh: "KIOSK", nguoiThaoTac: u });
  return json({ serverNow: new Date().toISOString(), ketQua: r });
}
