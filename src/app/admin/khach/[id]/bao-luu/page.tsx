import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ghiDanh, theVe } from "@/db/schema";
import { taiKhachDuocXem } from "@/server/page-guard";
import { coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { ngayVN } from "@/lib/time";
import { BaoLuuForm } from "./form";
import { baoLuuAction } from "../../../_actions/khach";

export const metadata = { title: "Bảo lưu" };

export default async function BaoLuuPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ the?: string; gd?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  if (!coQuyen(g.u, "DIEU_CHINH_THE")) return <KhongCoQuyen thongDiep="Chỉ Chủ trung tâm hoặc Quản lý cơ sở được bảo lưu." />;
  let doiTuong: { loai: "the" | "gd"; id: number; ten: string; choPhep: boolean; toiDa: number; daDung: number; het: string | null } | null = null;
  if (sp.gd) {
    const [x] = await db.select().from(ghiDanh).where(eq(ghiDanh.id, Number(sp.gd)));
    if (x && x.khachHangId === g.k.id) doiTuong = { loai: "gd", id: x.id, ten: x.tenKhoaHoc, choPhep: x.choBaoLuu, toiDa: x.baoLuuToiDaNgay ?? 0, daDung: 0, het: null };
  } else if (sp.the) {
    const [x] = await db.select().from(theVe).where(eq(theVe.id, Number(sp.the)));
    if (x && x.khachHangId === g.k.id) doiTuong = { loai: "the", id: x.id, ten: `${x.maThe} · ${x.tenSanPham}`, choPhep: x.choBaoLuu, toiDa: x.baoLuuToiDaNgay ?? 0, daDung: x.soNgayDaBaoLuu, het: x.ngayHetHan };
  }
  if (!doiTuong) return <KhongCoQuyen thongDiep="Không tìm thấy thẻ hoặc ghi danh." />;
  return (
    <>
      <PageHeader title="Bảo lưu" sub={`${g.k.hoTen} · ${doiTuong.ten}`} />
      <BaoLuuForm action={baoLuuAction.bind(null, g.k.id)} khachId={g.k.id} d={doiTuong} homNay={ngayVN()} />
    </>
  );
}
