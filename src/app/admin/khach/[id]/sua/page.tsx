import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo, nguoiLienHe } from "@/db/schema";
import { taiKhachDuocXem } from "@/server/page-guard";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { KhachForm } from "../../khach-form";
import { suaKhachAction } from "../../../_actions/khach";

export const metadata = { title: "Sửa hồ sơ" };

export default async function SuaKhach({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  const { k, u } = g;
  const [lh] = k.nguoiLienHeId ? await db.select().from(nguoiLienHe).where(eq(nguoiLienHe.id, k.nguoiLienHeId)) : [];
  const ds = await db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id));
  return (
    <>
      <PageHeader title={`Sửa hồ sơ ${k.maKh}`} sub="Mã khách không đổi (D3)" />
      <KhachForm
        idSua={k.id}
        action={suaKhachAction.bind(null, k.id)}
        coSo={ds}
        coSoMacDinh={k.coSoId}
        chonCoSo={u.vaiTro === "CHU"}
        gt={{ hoTen: k.hoTen, ngaySinh: k.ngaySinh, sdt: k.sdt, lhHoTen: lh?.hoTen, lhSdt: lh?.sdt, lhQuanHe: lh?.quanHe, coSoId: k.coSoId, ghiChu: k.ghiChu, ghiChuSucKhoe: k.ghiChuSucKhoe }}
      />
    </>
  );
}
