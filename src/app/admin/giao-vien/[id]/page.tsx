import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coSo, giaoVien, giaoVienCoSo } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { GvForm } from "./form";
import { luuGiaoVienAction } from "../../_actions/quan-ly";

export const metadata = { title: "Giáo viên" };

export default async function GvEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_LOP_GV_QR")) return <KhongCoQuyen />;
  const moi = id === "moi";
  const [g] = moi ? [] : await db.select().from(giaoVien).where(eq(giaoVien.id, Number(id)));
  if (!moi && !g) notFound();
  const cs = g ? (await db.select().from(giaoVienCoSo).where(eq(giaoVienCoSo.giaoVienId, g.id))).map((x) => x.coSoId) : [];
  if (g && u.vaiTro !== "CHU" && !cs.includes(u.coSoId!)) return <KhongCoQuyen thongDiep="Giáo viên không dạy ở cơ sở của bạn" />;
  const css = await db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id));
  return (
    <>
      <PageHeader title={moi ? "Thêm giáo viên" : g.hoTen} />
      <GvForm action={luuGiaoVienAction.bind(null, moi ? null : g.id)} coSo={u.vaiTro === "CHU" ? css : null} gt={g ? { ...g, coSoIds: cs } : {}} />
    </>
  );
}
