import Link from "next/link";
import { ScanLine, UserPlus, Users, AlarmClock, Wallet, Ticket, GraduationCap, ShieldAlert, ClipboardCheck } from "lucide-react";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { tongQuan, dsCheckIn, luotTheoGio } from "@/server/queries";
import { Card, CardHeader, PageHeader, Stat, LinkButton, Table, Th, Td, Empty } from "@/components/ui";
import { KetQuaBadge } from "@/components/checkin-badge";
import { fmtGio, fmtNgay, ngayVN } from "@/lib/time";
import { fmtTien } from "@/lib/text";
import { LiveRefresh } from "./live-refresh";

export const metadata = { title: "Tổng quan" };

export default async function TongQuanPage() {
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const ngay = ngayVN();
  const [s, moi, gio] = await Promise.all([tongQuan(cs, ngay), dsCheckIn({ coSoId: cs, ngay, limit: 20 }), luotTheoGio(cs, ngay)]);
  const xemTien = coQuyen(u, "XEM_DOANH_THU");
  const maxGio = Math.max(1, ...gio.map((g) => g.n));
  return (
    <>
      <LiveRefresh giay={15} />
      <PageHeader
        title="Tổng quan hôm nay"
        sub={`${fmtNgay(ngay)} · ${cs ? "1 cơ sở" : "Tất cả cơ sở"}`}
        action={
          <>
            <LinkButton href="/admin/checkin" variant="secondary">
              <ScanLine className="size-4" /> Check-in hộ
            </LinkButton>
            <LinkButton href="/admin/khach/moi">
              <UserPlus className="size-4" /> Thêm khách
            </LinkButton>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
        <Stat label="Lượt check-in" value={s.luot} sub={`${s.chan} bị chặn · ${s.vuot} vượt chặn`} icon={<ScanLine className="size-5" />} />
        <Stat label="Khách mới / cũ" value={`${s.moi} / ${s.cu}`} sub="Mới = lượt vào đầu tiên trong đời" tone="ok" icon={<Users className="size-5" />} />
        <Stat label="Mã thẻ xuất" value={s.tongTheXuat} sub={s.theXuat.map((x) => `${x.ten}: ${x.n}`).join(" · ") || "Chưa bán thẻ"} tone="violet" icon={<Ticket className="size-5" />} />
        <Stat label="Ghi danh khoá học" value={s.tongGhiDanh} sub={s.ghiDanhKhoa.map((x) => `${x.ten}: ${x.n}`).join(" · ") || "Chưa có"} tone="brand" icon={<GraduationCap className="size-5" />} />
        <Link href="/admin/sap-het">
          <Stat label="Khách sắp hết" value={s.sapHet} sub="Cần gọi nhắc gia hạn" tone="warn" icon={<AlarmClock className="size-5" />} />
        </Link>
        <Link href="/admin/khach?tab=cho-duyet">
          <Stat label="Hồ sơ chờ duyệt" value={s.choDuyet} sub="Khách tự đăng ký" tone="warn" icon={<ClipboardCheck className="size-5" />} />
        </Link>
        {xemTien && (
          <>
            <Stat label="Doanh số bán hôm nay" value={fmtTien(s.dsKhoa + s.dsThe)} sub={`Khoá học ${fmtTien(s.dsKhoa)} · Thẻ vé ${fmtTien(s.dsThe)}`} tone="ok" icon={<Wallet className="size-5" />} />
            <Stat label="Tiền thực thu hôm nay" value={fmtTien(s.thucThu)} sub="Gồm cọc, trừ hoàn tiền" tone="brand" icon={<Wallet className="size-5" />} />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="20 lượt check-in mới nhất" sub="Tự cập nhật" action={<LinkButton href="/admin/checkin" variant="ghost" size="sm">Xem tất cả →</LinkButton>} />
          {moi.length === 0 ? (
            <Empty>Chưa có lượt check-in nào hôm nay.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Giờ</Th>
                  <Th>Mã XN</Th>
                  <Th>Khách</Th>
                  <Th>Thẻ</Th>
                  <Th>Lượt còn</Th>
                  <Th>Lớp · GV</Th>
                  {!cs && <Th>Cơ sở</Th>}
                  <Th>Kết quả</Th>
                </tr>
              </thead>
              <tbody>
                {moi.map((r) => (
                  <tr key={r.id} className={r.ketQua === "BI_CHAN" ? "bg-bad-soft/50" : ""}>
                    <Td className="tabular font-semibold">{fmtGio(r.thoiGian)}</Td>
                    <Td className="tabular font-bold tracking-wider">{r.maXacNhan}</Td>
                    <Td>
                      <Link href={`/admin/khach/${r.khachId}`} className="font-semibold hover:text-brand">
                        {r.hoTen}
                      </Link>
                      <div className="text-xs text-ink-3">{r.maKh}</div>
                    </Td>
                    <Td>{r.the ?? "—"}</Td>
                    <Td className="tabular">{r.soLuotConSau ?? "∞"}</Td>
                    <Td className="text-ink-2">{[r.lop, r.giaoVien].filter(Boolean).join(" · ") || "—"}</Td>
                    {!cs && <Td>{r.coSo}</Td>}
                    <Td>
                      <KetQuaBadge ketQua={r.ketQua} mau={r.mau} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="Lượt vào theo giờ" />
          <div className="flex h-48 items-end gap-1 px-4 pt-4 pb-2">
            {Array.from({ length: 17 }, (_, i) => i + 5).map((h) => {
              const n = gio.find((g) => g.h === h)?.n ?? 0;
              return (
                <div key={h} className="flex flex-1 flex-col items-center gap-1" title={`${h}h: ${n} lượt`}>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-brand to-brand-2" style={{ height: `${(n / maxGio) * 140}px`, minHeight: n ? 4 : 0 }} />
                  <span className="text-[10px] text-ink-3">{h}</span>
                </div>
              );
            })}
          </div>
          {s.chan > 0 && (
            <div className="m-4 mt-0 flex items-center gap-2 rounded-xl bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">
              <ShieldAlert className="size-4" /> {s.chan} lượt bị chặn hôm nay
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
