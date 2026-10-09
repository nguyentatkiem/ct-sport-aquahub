import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo } from "@/db/schema";
import { canDangNhap, phamViCoSo } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import Kiosk from "./kiosk";

export const metadata = { title: "Ki-ốt check-in" };
export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const u = await canDangNhap();
  const cd = await docCaiDat();
  const ds = await db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).where(eq(coSo.trangThai, "HOAT_DONG")).orderBy(asc(coSo.id));
  const cs = u.vaiTro === "CHU" ? await phamViCoSo(u) : u.coSoId;
  return <Kiosk tenTrungTam={cd.tenTrungTam} coSo={ds} coSoMacDinh={cs} chonCoSo={u.vaiTro === "CHU"} />;
}
