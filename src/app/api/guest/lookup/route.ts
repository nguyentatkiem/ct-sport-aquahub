import { giaiMaQr, traCuuKhach, vuotGioiHan } from "@/server/guest";
import { json, khoaThietBi } from "@/server/http";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { qr?: string; q?: string; last4?: string };
  const qr = await giaiMaQr(String(body.qr ?? ""));
  if (!qr || !qr.hieuLuc) return json({ loi: "QR_HET_HIEU_LUC" }, 410);
  const { dev, ip } = await khoaThietBi();
  if ((await vuotGioiHan("dev:" + dev, 10)) || (await vuotGioiHan("ip:" + ip, 60))) return json({ loi: "QUA_NHIEU" }, 429);
  const q = String(body.q ?? "").slice(0, 40);
  if (!q.trim()) return json({ buoc: "khong_thay" });
  return json(await traCuuKhach(q, body.last4 ? String(body.last4).slice(0, 4) : null));
}
