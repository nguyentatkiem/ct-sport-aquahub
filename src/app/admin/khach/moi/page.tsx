import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo } from "@/db/schema";
import { canDangNhap, phamViCoSo } from "@/server/auth";
import { PageHeader } from "@/components/ui";
import { KhachForm } from "../khach-form";
import { taoKhachAction } from "../../_actions/khach";

export const metadata = { title: "Thêm khách" };

export default async function KhachMoi() {
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const ds = await db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).where(eq(coSo.trangThai, "HOAT_DONG")).orderBy(asc(coSo.id));
  return (
    <>
      <PageHeader title="Thêm khách mới" sub="Sau khi lưu, chuyển thẳng sang bán thẻ hoặc ghi danh (L2 → L3)" />
      <KhachForm action={taoKhachAction} coSo={ds} coSoMacDinh={cs} chonCoSo={u.vaiTro === "CHU"} />
    </>
  );
}
