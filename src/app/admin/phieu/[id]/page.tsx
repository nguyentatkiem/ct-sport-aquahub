import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coSo, donHang, khachHang, nguoiDung, phieuThu } from "@/db/schema";
import { canDangNhap, kiemTraCoSo, LoiQuyen } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { fmtNgayGio } from "@/lib/time";
import { fmtTien } from "@/lib/text";
import { LOAI_PHIEU, HINH_THUC } from "@/lib/labels";
import { PhieuActions } from "./client";

export const metadata = { title: "Phiếu thu" };

/** FR-BH-07: phiếu thu đơn giản (không phải hoá đơn), khổ giấy nhiệt 80 mm và ảnh PNG. */
export default async function PhieuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await canDangNhap();
  const [r] = await db
    .select({ p: phieuThu, d: donHang, k: khachHang, cs: coSo, nd: nguoiDung.hoTen })
    .from(phieuThu)
    .innerJoin(donHang, eq(donHang.id, phieuThu.donHangId))
    .innerJoin(khachHang, eq(khachHang.id, phieuThu.khachHangId))
    .innerJoin(coSo, eq(coSo.id, phieuThu.coSoId))
    .leftJoin(nguoiDung, eq(nguoiDung.id, phieuThu.nguoiThuId))
    .where(eq(phieuThu.id, Number(id)));
  if (!r) notFound();
  try {
    await kiemTraCoSo(u, r.p.coSoId, r.p.maPhieu);
  } catch (e) {
    if (e instanceof LoiQuyen) return <KhongCoQuyen thongDiep={e.message} />;
    throw e;
  }
  const cd = await docCaiDat();
  const dong: [string, string][] = [
    ["Số phiếu", r.p.maPhieu],
    ["Thời gian", fmtNgayGio(r.p.thoiGian)],
    ["Cơ sở", r.cs.ten],
    ["Khách", `${r.k.hoTen} (${r.k.maKh})`],
    ["Đơn", `${r.d.maDon} · ${r.d.tenSanPham}`],
    ["Loại", LOAI_PHIEU[r.p.loai]],
    ["Hình thức", HINH_THUC[r.p.hinhThuc]],
    ["Số tiền", (r.p.loai === "HOAN_TIEN" ? "−" : "") + fmtTien(r.p.soTien)],
    ["Giá thực thu", fmtTien(r.d.giaThucThu)],
    ["Đã thu", fmtTien(r.d.daThu)],
    ["Còn nợ", fmtTien(r.d.conNo)],
    ["Người thu", r.nd ?? ""],
  ];
  if (r.p.ghiChu) dong.push(["Ghi chú", r.p.ghiChu]);
  return (
    <div className="grid justify-items-center gap-4">
      <style>{`@page { size: 80mm auto; margin: 3mm } @media print { aside, header, nav { display:none !important } main { padding:0 !important } }`}</style>
      <PhieuActions tieuDe={cd.tenTrungTam} dong={dong} huy={r.p.trangThai === "DA_HUY"} ma={r.p.maPhieu} />
      <div className="w-[80mm] bg-white p-[4mm] font-mono text-[11px] text-black shadow print:shadow-none">
        <div className="text-center text-[13px] font-bold">{cd.tenTrungTam}</div>
        <div className="mb-2 text-center">PHIẾU THU{r.p.trangThai === "DA_HUY" ? " (ĐÃ HUỶ)" : ""}</div>
        {dong.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-dashed border-black/30 py-0.5">
            <span>{k}</span>
            <span className="text-right font-bold">{v}</span>
          </div>
        ))}
        <div className="mt-2 text-center text-[10px]">Phiếu thu nội bộ, không phải hoá đơn GTGT.</div>
      </div>
    </div>
  );
}
