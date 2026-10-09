import Link from "next/link";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsCongNo, dsPhieuThu } from "@/server/queries";
import { Card, PageHeader, Table, Th, Td, Empty, Tabs, Badge, Input, Select, Button, LinkButton, Stat } from "@/components/ui";
import { congNgay, fmtNgay, fmtNgayGio, ngayVN } from "@/lib/time";
import { fmtTien } from "@/lib/text";
import { LOAI_PHIEU, HINH_THUC, TRANG_THAI_TT } from "@/lib/labels";

export const metadata = { title: "Thu tiền & công nợ" };

export default async function ThuTienPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const tab = sp.tab ?? "cong-no";
  return (
    <>
      <PageHeader title="Thu tiền & công nợ" sub="Thu nốt: mở khách, chọn đơn còn nợ, ghi nhận thu tiền (L4)" />
      <Tabs
        active={tab}
        items={[
          { key: "cong-no", label: "Khách còn nợ", href: "?tab=cong-no" },
          { key: "phieu", label: "Phiếu thu", href: "?tab=phieu" },
        ]}
      />
      {tab === "cong-no" ? <CongNo cs={cs} /> : <Phieu cs={cs} sp={sp} xemTien={coQuyen(u, "XEM_DOANH_THU")} xuat={coQuyen(u, "XUAT_EXCEL")} />}
    </>
  );
}

async function CongNo({ cs }: { cs: number | null }) {
  const rows = await dsCongNo(cs);
  const tong = rows.reduce((a, r) => a + r.d.conNo, 0);
  return (
    <Card>
      <div className="border-b border-line p-3 text-sm">
        <b>{rows.length}</b> đơn còn nợ · tổng <b className="text-bad">{fmtTien(tong)}</b>
      </div>
      {rows.length === 0 ? (
        <Empty>Không có khách còn nợ.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Khách</Th>
              <Th>SĐT</Th>
              <Th>Đơn</Th>
              <Th>Ngày bán</Th>
              <Th>Thực thu</Th>
              <Th>Đã thu</Th>
              <Th>Còn nợ</Th>
              <Th>Trạng thái</Th>
              {!cs && <Th>Cơ sở</Th>}
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.d.id}>
                <Td>
                  <Link href={`/admin/khach/${r.k.id}`} className="font-semibold hover:text-brand">
                    {r.k.hoTen}
                  </Link>
                  <div className="text-xs text-ink-3">{r.k.maKh}</div>
                </Td>
                <Td>{r.k.sdt ?? r.lhSdt ?? "—"}</Td>
                <Td>
                  {r.d.maDon}
                  <div className="text-xs text-ink-3">{r.d.tenSanPham}</div>
                </Td>
                <Td>{fmtNgay(r.d.ngayBan)}</Td>
                <Td className="tabular">{fmtTien(r.d.giaThucThu)}</Td>
                <Td className="tabular">{fmtTien(r.d.daThu)}</Td>
                <Td className="tabular font-bold text-bad">{fmtTien(r.d.conNo)}</Td>
                <Td>
                  <Badge tone="warn">{TRANG_THAI_TT[r.d.trangThaiTt]}</Badge>
                </Td>
                {!cs && <Td>{r.cs}</Td>}
                <Td>
                  <LinkButton size="sm" href={`/admin/khach/${r.k.id}?tab=thanh-toan&don=${r.d.id}`}>
                    Thu tiền
                  </LinkButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

async function Phieu({ cs, sp, xemTien, xuat }: { cs: number | null; sp: Record<string, string | undefined>; xemTien: boolean; xuat: boolean }) {
  const den = sp.den || ngayVN();
  const tu = sp.tu || congNgay(den, -6);
  const rows = await dsPhieuThu({ coSoId: cs, tu, den, loai: sp.loai || null, q: sp.q || null });
  const hl = rows.filter((r) => r.p.trangThai === "HIEU_LUC");
  const sum = (f: (r: (typeof rows)[number]) => boolean) => hl.filter(f).reduce((a, r) => a + (r.p.loai === "HOAN_TIEN" ? -r.p.soTien : r.p.soTien), 0);
  return (
    <>
      {xemTien && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Thực thu (gồm cọc)" value={fmtTien(sum(() => true))} />
          <Stat label="Tiền mặt" value={fmtTien(sum((r) => r.p.hinhThuc === "TIEN_MAT"))} tone="ok" />
          <Stat label="Chuyển khoản" value={fmtTien(sum((r) => r.p.hinhThuc === "CHUYEN_KHOAN"))} tone="brand" />
          <Stat label="Trong đó cọc" value={fmtTien(sum((r) => r.p.loai === "COC"))} tone="warn" />
        </div>
      )}
      <Card>
        <form className="grid grid-cols-2 gap-2 border-b border-line p-3 md:grid-cols-6">
          <input type="hidden" name="tab" value="phieu" />
          <Input name="q" defaultValue={sp.q} placeholder="Số phiếu, mã đơn, tên khách" className="col-span-2" />
          <Input type="date" name="tu" defaultValue={tu} />
          <Input type="date" name="den" defaultValue={den} />
          <Select name="loai" defaultValue={sp.loai ?? ""}>
            <option value="">Mọi loại</option>
            {Object.entries(LOAI_PHIEU).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1">
              Lọc
            </Button>
            {xuat && (
              <LinkButton variant="ghost" href={`/api/export/phieu-thu?tu=${tu}&den=${den}`}>
                Excel
              </LinkButton>
            )}
          </div>
        </form>
        {rows.length === 0 ? (
          <Empty>Không có phiếu thu trong kỳ.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Số phiếu</Th>
                <Th>Thời gian</Th>
                <Th>Khách</Th>
                <Th>Đơn</Th>
                <Th>Loại</Th>
                <Th>Số tiền</Th>
                <Th>Hình thức</Th>
                <Th>Người thu</Th>
                {!cs && <Th>Cơ sở</Th>}
                <Th>Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p.id} className={r.p.trangThai === "DA_HUY" ? "text-ink-3" : ""}>
                  <Td>
                    <Link href={`/admin/phieu/${r.p.id}`} className="font-semibold hover:text-brand">
                      {r.p.maPhieu}
                    </Link>
                  </Td>
                  <Td className="tabular">{fmtNgayGio(r.p.thoiGian)}</Td>
                  <Td>
                    <Link href={`/admin/khach/${r.k.id}?tab=thanh-toan`} className="hover:text-brand">
                      {r.k.hoTen}
                    </Link>
                  </Td>
                  <Td>
                    {r.maDon}
                    <div className="text-xs text-ink-3">{r.tenSp}</div>
                  </Td>
                  <Td>
                    <Badge tone={r.p.loai === "HOAN_TIEN" ? "violet" : r.p.loai === "COC" ? "warn" : "ok"}>{LOAI_PHIEU[r.p.loai]}</Badge>
                  </Td>
                  <Td className="tabular font-semibold">{(r.p.loai === "HOAN_TIEN" ? "−" : "") + fmtTien(r.p.soTien)}</Td>
                  <Td>{HINH_THUC[r.p.hinhThuc]}</Td>
                  <Td>{r.nguoiThu ?? "—"}</Td>
                  {!cs && <Td>{r.cs}</Td>}
                  <Td>{r.p.trangThai === "DA_HUY" ? <Badge>Đã huỷ</Badge> : <Badge tone="ok">Hiệu lực</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
