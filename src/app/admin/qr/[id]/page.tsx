import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { coSo, lopHoc, maQr } from "@/db/schema";
import { canDangNhap, kiemTraCoSo, LoiQuyen } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import { baseUrl, qrSvg } from "@/server/qr";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "In QR" };

/** FR-LH-03: QR lớp/quầy khổ A5, có logo và hướng dẫn 2 ngôn ngữ. Lưu PDF bằng hộp thoại In của trình duyệt. */
export default async function InQr({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await canDangNhap();
  const [r] = await db.select({ q: maQr, cs: coSo, lop: lopHoc }).from(maQr).innerJoin(coSo, eq(coSo.id, maQr.coSoId)).leftJoin(lopHoc, eq(lopHoc.id, maQr.lopHocId)).where(eq(maQr.id, Number(id)));
  if (!r) notFound();
  try {
    await kiemTraCoSo(u, r.q.coSoId);
  } catch (e) {
    if (e instanceof LoiQuyen) return <KhongCoQuyen thongDiep={e.message} />;
    throw e;
  }
  const cd = await docCaiDat();
  const svg = await qrSvg(`${await baseUrl()}/c/${r.q.token}`, 0);
  return (
    <div className="grid justify-items-center gap-4">
      <style>{`@page { size: A5 portrait; margin: 0 } @media print { aside, header, nav { display:none !important } main { padding:0 !important; max-width:none !important } }`}</style>
      <div className="no-print flex items-center gap-2">
        <PrintButton label="In / Lưu PDF khổ A5" />
        <span className="text-sm text-ink-2">Chọn khổ A5 trong hộp thoại in. Quét được từ khoảng cách 50 cm.</span>
      </div>
      <div className="flex h-[210mm] w-[148mm] flex-col items-center bg-white px-[12mm] py-[12mm] text-center shadow-lg print:shadow-none">
        <div className="flex items-center gap-3">
          {cd.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cd.logoUrl} alt="" className="h-[16mm] w-auto" />
          ) : (
            <div className="grid size-[14mm] place-items-center rounded-[3mm] bg-gradient-to-br from-brand-2 to-brand text-[8mm] text-white">🏊</div>
          )}
          <div className="text-left">
            <div className="text-[16pt] leading-tight font-extrabold text-ink">{cd.tenTrungTam}</div>
            <div className="text-[11pt] text-ink-2">{r.cs.ten}</div>
          </div>
        </div>
        <div className="mt-[8mm] rounded-full bg-brand-soft px-[6mm] py-[2mm] text-[14pt] font-bold text-brand">{r.q.loai === "LOP" ? `Lớp: ${r.q.ten}` : r.q.ten}</div>
        {r.lop?.lichText && <div className="mt-[2mm] text-[11pt] text-ink-2">{r.lop.lichText}</div>}
        <div className="mt-[8mm] size-[95mm] rounded-[4mm] p-[3mm] ring-[1.5mm] ring-brand [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="mt-[8mm] text-[15pt] font-extrabold text-ink">Quét mã bằng camera điện thoại để check-in</div>
        <div className="mt-[1mm] text-[11pt] text-ink-2">Không cần cài app. Nhập SĐT hoặc mã khách, chạm Check-in.</div>
        <div className="mt-[4mm] text-[13pt] font-bold text-ink">Scan with your phone camera to check in</div>
        <div className="text-[10pt] text-ink-2">No app needed. Enter your phone number or member code.</div>
      </div>
    </div>
  );
}
