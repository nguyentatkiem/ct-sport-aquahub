import { giaiMaQr, giaiTokenKhach, tokenNho, vuotGioiHan } from "@/server/guest";
import { thucHienCheckIn } from "@/server/checkin";
import { json, khoaThietBi } from "@/server/http";
import { cheTen } from "@/lib/text";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { qr?: string; toks?: string[] };
  const qr = await giaiMaQr(String(body.qr ?? ""));
  if (!qr || !qr.hieuLuc) return json({ loi: "QR_HET_HIEU_LUC" }, 410);
  const { dev } = await khoaThietBi();
  if (await vuotGioiHan("ci:" + dev, 20)) return json({ loi: "QUA_NHIEU" }, 429);
  const toks = Array.isArray(body.toks) ? body.toks.slice(0, 6) : [];
  const ids = [...new Set((await Promise.all(toks.map((t) => giaiTokenKhach(String(t))))).filter((x): x is number => !!x))];
  if (!ids.length) return json({ loi: "TOKEN_HET_HAN" }, 400);
  const ketQua = [];
  const nho = [];
  for (const id of ids) {
    const r = await thucHienCheckIn({ khachHangId: id, coSoId: qr.coSo.id, lopHocId: qr.lop?.id ?? null, maQrId: qr.id, kenh: "KHACH_TU_QUET" });
    ketQua.push(r);
    // FR-CI-09: chỉ ghi nhớ khi đã vào hồ thành công
    if (["HOP_LE", "CANH_BAO", "VUOT_CHAN", "DA_CHECKIN"].includes(r.ketQua)) nho.push({ tok: await tokenNho(id), tenChe: cheTen(r.khach.hoTen), id });
  }
  return json({ serverNow: new Date().toISOString(), ketQua, nho });
}
