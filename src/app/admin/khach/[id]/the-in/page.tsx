import { taiKhachDuocXem } from "@/server/page-guard";
import { qrSvg, baseUrl } from "@/server/qr";
import { docCaiDat } from "@/server/settings";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "In thẻ QR" };

/** Thẻ nhựa in QR cá nhân cho trẻ không có điện thoại (L1b, A8). Cỡ thẻ ATM 85.6 x 54 mm. */
export default async function TheInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await taiKhachDuocXem(Number(id));
  if (!g.ok) return <KhongCoQuyen thongDiep={g.loi} />;
  const cd = await docCaiDat();
  const svg = await qrSvg(`${await baseUrl()}/q/${g.k.qrToken}`, 0);
  return (
    <div className="grid justify-items-center gap-4">
      <style>{`@page { size: 85.6mm 54mm; margin: 0 } @media print { aside, header, nav { display:none !important } main { padding:0 !important } }`}</style>
      <div className="no-print flex items-center gap-2">
        <PrintButton />
        <span className="text-sm text-ink-2">Khổ thẻ 85,6 × 54 mm. Thẻ không in mã khách để tránh bị đoán.</span>
      </div>
      <div className="flex h-[54mm] w-[85.6mm] items-center gap-3 overflow-hidden rounded-[3mm] bg-gradient-to-br from-brand-2 to-brand p-[3mm] text-white shadow-lg print:shadow-none">
        <div className="size-[44mm] shrink-0 rounded-[2mm] bg-white p-[1.5mm] [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="min-w-0">
          <div className="text-[9pt] leading-tight font-extrabold">{cd.tenTrungTam}</div>
          <div className="mt-[2mm] text-[11pt] leading-tight font-bold">{g.k.hoTen}</div>
          <div className="mt-[3mm] text-[7pt] leading-snug opacity-90">Đưa mã vào máy check-in tại quầy.</div>
          <div className="text-[7pt] leading-snug opacity-90">Show this code at the kiosk.</div>
        </div>
      </div>
    </div>
  );
}
