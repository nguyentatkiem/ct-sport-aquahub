import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coSo, sanPham } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { SanPhamForm } from "./form";
import { luuSanPhamAction } from "../../_actions/quan-ly";

export const metadata = { title: "Sản phẩm" };

export default async function SanPhamEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ loai?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const u = await canDangNhap();
  if (!coQuyen(u, "SUA_SAN_PHAM")) return <KhongCoQuyen thongDiep="Chỉ Chủ trung tâm được tạo/sửa sản phẩm." />;
  const moi = id === "moi";
  const [s] = moi ? [] : await db.select().from(sanPham).where(eq(sanPham.id, Number(id)));
  if (!moi && !s) notFound();
  const css = await db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id));
  const ve = await db.select({ id: sanPham.id, ten: sanPham.ten }).from(sanPham).where(eq(sanPham.loai, "THE_VE"));
  return (
    <>
      <PageHeader title={moi ? "Thêm sản phẩm" : `Sửa: ${s.ten}`} sub={moi ? undefined : "Thay đổi chỉ áp dụng cho thẻ/ghi danh bán từ nay (BR-22)."} />
      <SanPhamForm action={luuSanPhamAction.bind(null, moi ? null : s.id)} coSo={css} ve={ve.filter((v) => v.id !== s?.id)} gt={s ?? { loai: sp.loai === "KHOA_HOC" ? "KHOA_HOC" : "THE_VE" }} />
    </>
  );
}
