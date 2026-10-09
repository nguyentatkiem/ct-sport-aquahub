import { and, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { nhatKy, coSo } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, PageHeader, Table, Th, Td, Empty, Input, Button, Select, Badge } from "@/components/ui";
import { congNgay, dauNgayVN, fmtNgayGio, ngayVN } from "@/lib/time";
import { VAI_TRO } from "@/lib/labels";

export const metadata = { title: "Nhật ký thao tác" };

export default async function NhatKyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  if (!coQuyen(u, "XEM_NHAT_KY")) return <KhongCoQuyen />;
  const den = sp.den || ngayVN();
  const tu = sp.tu || congNgay(den, -6);
  const w: SQL[] = [gte(nhatKy.thoiGian, dauNgayVN(tu)), lte(nhatKy.thoiGian, dauNgayVN(congNgay(den, 1)))];
  if (sp.module) w.push(eq(nhatKy.module, sp.module));
  if (sp.q?.trim()) w.push(or(ilike(nhatKy.doiTuong, `%${sp.q}%`), ilike(nhatKy.tenNguoiDung, `%${sp.q}%`), ilike(nhatKy.hanhDong, `%${sp.q}%`), ilike(nhatKy.lyDo, `%${sp.q}%`))!);
  const [rows, modules, css] = await Promise.all([
    db.select().from(nhatKy).where(and(...w)).orderBy(desc(nhatKy.thoiGian)).limit(500),
    db.selectDistinct({ m: nhatKy.module }).from(nhatKy),
    db.select().from(coSo),
  ]);
  const quanTrong = ["VUOT_CHAN", "HUY_PHIEU", "HOAN_TIEN", "XOA_MEM", "TU_CHOI_TRUY_CAP", "XUAT_EXCEL", "DAT_LAI_MAT_KHAU", "KHOA_DANG_NHAP"];
  return (
    <>
      <PageHeader title="Nhật ký thao tác" sub="Ai làm gì, lúc nào, giá trị cũ và mới. Không sửa, không xoá được." />
      <Card>
        <form className="grid grid-cols-2 gap-2 border-b border-line p-3 md:grid-cols-5">
          <Input name="q" defaultValue={sp.q} placeholder="Người, đối tượng, hành động" className="col-span-2 md:col-span-1" />
          <Input type="date" name="tu" defaultValue={tu} />
          <Input type="date" name="den" defaultValue={den} />
          <Select name="module" defaultValue={sp.module ?? ""}>
            <option value="">Mọi module</option>
            {modules.map((m) => (
              <option key={m.m} value={m.m}>
                {m.m}
              </option>
            ))}
          </Select>
          <Button variant="secondary">Lọc</Button>
        </form>
        {rows.length === 0 ? (
          <Empty>Không có thao tác.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Thời gian</Th>
                <Th>Người</Th>
                <Th>Cơ sở</Th>
                <Th>Module</Th>
                <Th>Hành động</Th>
                <Th>Đối tượng</Th>
                <Th>Giá trị cũ → mới</Th>
                <Th>Lý do</Th>
                <Th>IP / thiết bị</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td className="tabular whitespace-nowrap">{fmtNgayGio(r.thoiGian)}</Td>
                  <Td>
                    {r.tenNguoiDung ?? <i className="text-ink-3">Khách / hệ thống</i>}
                    {r.vaiTro && <div className="text-xs text-ink-3">{VAI_TRO[r.vaiTro]}</div>}
                  </Td>
                  <Td>{css.find((c) => c.id === r.coSoId)?.ma ?? "—"}</Td>
                  <Td>{r.module}</Td>
                  <Td>{quanTrong.includes(r.hanhDong) ? <Badge tone="warn">{r.hanhDong}</Badge> : <span className="text-sm">{r.hanhDong}</span>}</Td>
                  <Td className="max-w-48 truncate">{r.doiTuong}</Td>
                  <Td className="max-w-80 text-xs text-ink-2">
                    {r.giaTriCu ? <div className="truncate">Cũ: {JSON.stringify(r.giaTriCu)}</div> : null}
                    {r.giaTriMoi ? <div className="truncate">Mới: {JSON.stringify(r.giaTriMoi)}</div> : null}
                  </Td>
                  <Td className="max-w-56 text-sm">{r.lyDo}</Td>
                  <Td className="max-w-40 truncate text-xs text-ink-3" title={r.thietBi ?? ""}>
                    {r.ip}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
