import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { theVe } from "@/db/schema";
import { taiKhachDuocXem } from "@/server/page-guard";
import { dsSanPhamBan, dsLopCoSo, dsGiaoVien } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { moTaLuat } from "@/lib/rule-text";
import { ngayVN, tinhTuoi } from "@/lib/time";
import { GhiDanhForm } from "./form";
import { ghiDanhAction } from "../../../_actions/khach";

export const metadata = { title: "Ghi danh khoá học" };

export default async function GhiDanhPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  const { k, cs } = g;
  const homNay = ngayVN();
  const [khoa, ve, lops, gvs, theCon] = await Promise.all([
    dsSanPhamBan(k.coSoId, "KHOA_HOC"),
    dsSanPhamBan(k.coSoId, "THE_VE"),
    dsLopCoSo(k.coSoId),
    dsGiaoVien(k.coSoId, true),
    db
      .select({ id: theVe.id })
      .from(theVe)
      .where(
        and(
          eq(theVe.khachHangId, k.id),
          eq(theVe.trangThai, "HOAT_DONG"),
          or(isNull(theVe.soLuotConLai), gt(theVe.soLuotConLai, 0)),
          or(isNull(theVe.ngayHetHan), sql`${theVe.ngayHetHan} >= ${homNay}`),
        ),
      ),
  ]);
  return (
    <>
      <PageHeader title="Ghi danh khoá học" sub={`${k.hoTen} · ${k.maKh} · ${tinhTuoi(k.ngaySinh)} tuổi · ${cs.ten}`} />
      {k.trangThai !== "HOAT_DONG" ? (
        <p className="rounded-xl bg-warn-soft p-4 font-semibold text-warn">Hồ sơ chưa hoạt động. Duyệt hồ sơ trước khi ghi danh.</p>
      ) : (
        <GhiDanhForm
          action={ghiDanhAction.bind(null, k.id)}
          khachId={k.id}
          coTheVe={theCon.length > 0}
          khoa={khoa.map((s) => ({ id: s.id, ten: s.ten, gia: s.giaNiemYet, luat: moTaLuat(s), kemId: s.theVeKemTheoId }))}
          ve={ve.filter((v) => !v.laTheChuyenDoi).map((s) => ({ id: s.id, ten: s.ten, gia: s.giaNiemYet }))}
          lops={lops.map((l) => ({ id: l.l.id, ten: l.l.ten, spId: l.l.sanPhamId, gvId: l.l.giaoVienId, lich: l.l.lichText }))}
          gvs={gvs.map((x) => ({ id: x.id, ten: x.ho_ten }))}
        />
      )}
    </>
  );
}
