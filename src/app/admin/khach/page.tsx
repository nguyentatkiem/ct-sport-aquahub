import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsKhach, demChoDuyet } from "@/server/queries";
import { Card, PageHeader, Table, Th, Td, Empty, Input, Button, LinkButton, Tabs, Badge } from "@/components/ui";
import { fmtNgay, tinhTuoi } from "@/lib/time";
import { fmtTien } from "@/lib/text";
import { QUAN_HE } from "@/lib/labels";
import { DuyetNhanh } from "./client";

export const metadata = { title: "Khách hàng" };

export default async function KhachPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const tab = sp.tab ?? "hoat-dong";
  const [{ rows, coTiep, trang }, nCho] = await Promise.all([dsKhach({ coSoId: cs, q: sp.q, tab, trang: Number(sp.trang) || 1 }), demChoDuyet(cs)]);
  const qs = (o: Record<string, string | number | undefined>) => "?" + new URLSearchParams(Object.entries({ q: sp.q, tab, ...o }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  return (
    <>
      <PageHeader
        title="Khách hàng"
        sub="Tìm theo tên (có dấu hoặc không), SĐT, mã khách, mã thẻ"
        action={
          <>
            {coQuyen(u, "XUAT_EXCEL") && (
              <LinkButton variant="secondary" href="/api/export/khach">
                Xuất Excel
              </LinkButton>
            )}
            <LinkButton href="/admin/khach/moi">
              <UserPlus className="size-4" /> Thêm khách
            </LinkButton>
          </>
        }
      />
      <Tabs
        active={tab}
        items={[
          { key: "hoat-dong", label: "Đang hoạt động", href: "/admin/khach?tab=hoat-dong" },
          { key: "cho-duyet", label: <>Chờ duyệt {nCho > 0 && <Badge tone="warn">{nCho}</Badge>}</>, href: "/admin/khach?tab=cho-duyet" },
          { key: "ngung", label: "Đã ngừng", href: "/admin/khach?tab=ngung" },
        ]}
      />
      <Card>
        <form className="flex gap-2 border-b border-line p-3">
          <input type="hidden" name="tab" value={tab} />
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-3 left-3 size-5 text-ink-3" />
            <Input name="q" defaultValue={sp.q} placeholder="VD: nguyen minh, 0912…, LT00125, TV26…" className="pl-10" />
          </label>
          <Button variant="secondary">Tìm</Button>
        </form>
        {rows.length === 0 ? (
          <Empty>Không có khách phù hợp.</Empty>
        ) : (
          <>
            {/* Điện thoại: thẻ gọn (mục 8) */}
            <div className="divide-y divide-line md:hidden">
              {rows.map((r) => {
                const [ten, luot, han] = (r.theDangDung ?? "").split("|");
                return (
                  <Link key={r.id} href={`/admin/khach/${r.id}`} className="block px-4 py-3 active:bg-surface-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{r.hoTen}</span>
                      <span className="text-xs font-semibold text-ink-3">{r.maKh}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-ink-2">
                      {r.theDangDung ? `${ten} · còn ${luot} lượt${han ? ` · hạn ${fmtNgay(han)}` : ""}` : <span className="text-bad">Không có thẻ còn hiệu lực</span>}
                    </div>
                    {r.trangThai === "CHO_DUYET" && <Badge tone="warn">Chờ duyệt</Badge>}
                    {r.conNo > 0 && <Badge tone="bad">Nợ {fmtTien(r.conNo)}</Badge>}
                  </Link>
                );
              })}
            </div>
            <Table className="hidden md:block">
              <thead>
                <tr>
                  <Th>Mã</Th>
                  <Th>Họ tên</Th>
                  <Th>Tuổi</Th>
                  <Th>SĐT liên hệ</Th>
                  <Th>Thẻ đang dùng</Th>
                  <Th>Lượt còn</Th>
                  <Th>Hạn</Th>
                  <Th>Khoá học · GV</Th>
                  <Th>Còn nợ</Th>
                  {!cs && <Th>Cơ sở</Th>}
                  <Th>{tab === "cho-duyet" ? "Đăng ký lúc" : "Trạng thái"}</Th>
                  {tab === "cho-duyet" && <Th></Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const [ten, luot, han] = (r.theDangDung ?? "").split("|");
                  return (
                    <tr key={r.id} className="hover:bg-surface-2/60">
                      <Td className="font-semibold text-ink-2">{r.maKh}</Td>
                      <Td>
                        <Link href={`/admin/khach/${r.id}`} className="font-bold hover:text-brand">
                          {r.hoTen}
                        </Link>
                        {r.lhTen && (
                          <div className="text-xs text-ink-3">
                            {QUAN_HE[r.lhQuanHe ?? ""] ?? "LH"}: {r.lhTen}
                          </div>
                        )}
                      </Td>
                      <Td>{tinhTuoi(r.ngaySinh)}</Td>
                      <Td className="tabular">{r.sdt ?? r.lhSdt ?? "—"}</Td>
                      <Td>{ten || <span className="text-ink-3">—</span>}</Td>
                      <Td className="tabular font-semibold">{luot || "—"}</Td>
                      <Td>{han ? fmtNgay(han) : ten ? "Không hạn" : "—"}</Td>
                      <Td className="max-w-56 text-ink-2">{r.khoaHoc ?? (r.khoaHocMuon ? <i>Muốn: {r.khoaHocMuon}</i> : "—")}</Td>
                      <Td className={r.conNo > 0 ? "font-semibold text-bad" : "text-ink-3"}>{r.conNo > 0 ? fmtTien(r.conNo) : "—"}</Td>
                      {!cs && <Td>{r.coSo}</Td>}
                      <Td>
                        {tab === "cho-duyet" ? (
                          fmtNgay(r.ngayDangKy.toISOString().slice(0, 10))
                        ) : r.trangThai === "HOAT_DONG" ? (
                          <Badge tone="ok">Hoạt động</Badge>
                        ) : r.trangThai === "CHO_DUYET" ? (
                          <Badge tone="warn">Chờ duyệt</Badge>
                        ) : (
                          <Badge>Ngừng</Badge>
                        )}
                      </Td>
                      {tab === "cho-duyet" && (
                        <Td>
                          <DuyetNhanh id={r.id} />
                        </Td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
        {(trang > 1 || coTiep) && (
          <div className="flex justify-between border-t border-line p-3 text-sm">
            {trang > 1 ? <Link href={qs({ trang: trang - 1 })}>← Trang trước</Link> : <span />}
            <span className="text-ink-3">Trang {trang}</span>
            {coTiep ? <Link href={qs({ trang: trang + 1 })}>Trang sau →</Link> : <span />}
          </div>
        )}
      </Card>
    </>
  );
}
