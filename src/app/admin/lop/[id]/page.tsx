import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coSo, ghiDanh, khachHang, lopHoc, sanPham } from "@/db/schema";
import { canDangNhap, coQuyen, kiemTraCoSo, LoiQuyen, phamViCoSo } from "@/server/auth";
import { dsGiaoVien } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, Table, Th, Td, Empty, Badge } from "@/components/ui";
import { TRANG_THAI_GD } from "@/lib/labels";
import { LopForm } from "./form";
import { luuLopAction } from "../../_actions/quan-ly";

export const metadata = { title: "Lớp học" };

export default async function LopEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_LOP_GV_QR")) return <KhongCoQuyen />;
  const moi = id === "moi";
  const [l] = moi ? [] : await db.select().from(lopHoc).where(eq(lopHoc.id, Number(id)));
  if (!moi && !l) notFound();
  if (l) {
    try {
      await kiemTraCoSo(u, l.coSoId);
    } catch (e) {
      if (e instanceof LoiQuyen) return <KhongCoQuyen thongDiep={e.message} />;
      throw e;
    }
  }
  const cs = await phamViCoSo(u);
  const [css, khoa, gvs, hv] = await Promise.all([
    db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id)),
    db.select({ id: sanPham.id, ten: sanPham.ten }).from(sanPham).where(and(eq(sanPham.loai, "KHOA_HOC"), eq(sanPham.trangThai, "DANG_BAN"))),
    dsGiaoVien(u.vaiTro === "CHU" ? null : cs, true),
    l
      ? db
          .select({ g: ghiDanh, k: { id: khachHang.id, hoTen: khachHang.hoTen, maKh: khachHang.maKh } })
          .from(ghiDanh)
          .innerJoin(khachHang, eq(khachHang.id, ghiDanh.khachHangId))
          .where(and(eq(ghiDanh.lopHocId, l.id), inArray(ghiDanh.trangThai, ["DANG_HOC", "DU_DIEU_KIEN_TOT_NGHIEP", "BAO_LUU", "TOT_NGHIEP"])))
      : Promise.resolve([]),
  ]);
  if (l && !khoa.some((k) => k.id === l.sanPhamId)) {
    const [sp] = await db.select({ id: sanPham.id, ten: sanPham.ten }).from(sanPham).where(eq(sanPham.id, l.sanPhamId));
    khoa.push(sp);
  }
  return (
    <>
      <PageHeader title={moi ? "Tạo lớp" : l.ten} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <LopForm
          action={luuLopAction.bind(null, moi ? null : l.id)}
          coSo={u.vaiTro === "CHU" ? css : null}
          khoa={khoa}
          gvs={gvs.map((g) => ({ id: g.id, ten: g.ho_ten }))}
          gt={l ?? { coSoId: cs }}
          moi={moi}
        />
        {!moi && (
          <Card className="h-fit">
            <CardHeader title={`Học viên (${hv.length})`} />
            {hv.length === 0 ? (
              <Empty>Chưa có học viên ghi danh.</Empty>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Học viên</Th>
                    <Th>Buổi</Th>
                    <Th>Trạng thái</Th>
                  </tr>
                </thead>
                <tbody>
                  {hv.map(({ g, k }) => (
                    <tr key={g.id}>
                      <Td>
                        <Link href={`/admin/khach/${k.id}?tab=khoa`} className="font-semibold hover:text-brand">
                          {k.hoTen}
                        </Link>
                        <div className="text-xs text-ink-3">{k.maKh}</div>
                      </Td>
                      <Td className="tabular">
                        {g.soBuoiDaHoc}/{g.soBuoiTotNghiep ?? g.soBuoiHocGoc}
                      </Td>
                      <Td>
                        <Badge tone={g.trangThai === "DU_DIEU_KIEN_TOT_NGHIEP" ? "warn" : g.trangThai === "DANG_HOC" ? "ok" : "muted"}>{TRANG_THAI_GD[g.trangThai]}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
