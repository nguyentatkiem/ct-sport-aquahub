import { taiKhachDuocXem } from "@/server/page-guard";
import { dsSanPhamBan } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PageHeader } from "@/components/ui";
import { moTaLuat } from "@/lib/rule-text";
import { hetHanKhiBan } from "@/lib/checkin-engine";
import { ngayVN, tinhTuoi } from "@/lib/time";
import { BanTheForm } from "./form";
import { banTheAction } from "../../../_actions/khach";

export const metadata = { title: "Bán thẻ vé" };

export default async function BanThePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  const { k, cs } = g;
  const sps = await dsSanPhamBan(k.coSoId, "THE_VE");
  const homNay = ngayVN();
  return (
    <>
      <PageHeader title="Bán thẻ vé" sub={`${k.hoTen} · ${k.maKh} · ${tinhTuoi(k.ngaySinh)} tuổi · ${cs.ten}`} />
      {k.trangThai !== "HOAT_DONG" ? (
        <p className="rounded-xl bg-warn-soft p-4 font-semibold text-warn">Hồ sơ chưa hoạt động (chờ duyệt hoặc đã ngừng). Duyệt hồ sơ trước khi bán.</p>
      ) : (
        <BanTheForm
          action={banTheAction.bind(null, k.id)}
          khachId={k.id}
          sanPham={sps.map((s) => ({
            id: s.id,
            ten: s.ten,
            gia: s.giaNiemYet,
            luat: moTaLuat(s),
            hetHanDuKien: hetHanKhiBan(homNay, s.hanDungNgay, s.mocTinhHan),
            hanTuLanDau: s.mocTinhHan === "LAN_DAU_CHECKIN" && s.hanDungNgay != null ? s.hanDungNgay : null,
            soLuot: s.soLuot,
            chuyenDoi: s.laTheChuyenDoi,
          }))}
        />
      )}
    </>
  );
}
