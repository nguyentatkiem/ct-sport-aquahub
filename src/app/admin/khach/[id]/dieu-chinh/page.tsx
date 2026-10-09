import { eq } from "drizzle-orm";
import { db } from "@/db";
import { theVe } from "@/db/schema";
import { taiKhachDuocXem } from "@/server/page-guard";
import { coQuyen } from "@/server/auth";
import { trangThaiTheRow } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { TRANG_THAI_THE } from "@/lib/labels";
import { DieuChinhForm } from "./form";
import { dieuChinhAction } from "../../../_actions/khach";

export const metadata = { title: "Điều chỉnh thẻ" };

export default async function DieuChinhPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ the?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  if (!coQuyen(g.u, "DIEU_CHINH_THE")) return <KhongCoQuyen thongDiep="Chỉ Chủ trung tâm hoặc Quản lý cơ sở được điều chỉnh thẻ (BR-16)." />;
  const cards = await db.select().from(theVe).where(eq(theVe.khachHangId, g.k.id));
  return (
    <>
      <PageHeader title="Điều chỉnh thẻ vé" sub={`${g.k.hoTen} · ${g.k.maKh} · mọi thay đổi bắt buộc lý do và vào nhật ký`} />
      <DieuChinhForm
        action={dieuChinhAction.bind(null, g.k.id)}
        khachId={g.k.id}
        chon={Number(sp.the) || cards[0]?.id}
        cards={cards.map((t) => ({
          id: t.id,
          ma: t.maThe,
          ten: t.tenSanPham,
          conLai: t.soLuotConLai,
          het: t.ngayHetHan,
          trangThai: TRANG_THAI_THE[trangThaiTheRow(t)],
          huy: t.trangThai === "HUY",
          baoLuu: !!t.baoLuuDen,
        }))}
      />
    </>
  );
}
