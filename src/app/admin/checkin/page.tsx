import Link from "next/link";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsCheckIn, dsLopCoSo, dsGiaoVien } from "@/server/queries";
import { Card, CardHeader, PageHeader, Table, Th, Td, Empty, Select, Input, Button, LinkButton } from "@/components/ui";
import { KetQuaBadge } from "@/components/checkin-badge";
import { fmtGio, fmtNgay, ngayVN } from "@/lib/time";
import { KENH } from "@/lib/labels";
import { CheckInHo, LiveCheckins, VuotChanButton } from "./client";

export const metadata = { title: "Check-in" };

export default async function CheckInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const ngay = sp.ngay || ngayVN();
  const [rows, lops, gvs] = await Promise.all([
    dsCheckIn({ coSoId: cs, ngay, lopId: Number(sp.lop) || null, gvId: Number(sp.gv) || null, ketQua: sp.kq || null, kenh: sp.kenh || null, q: sp.q || null, limit: 500 }),
    dsLopCoSo(cs),
    dsGiaoVien(cs),
  ]);
  // Dòng bị chặn chưa xử lý nổi lên đầu (Q2)
  const sorted = [...rows].sort((a, b) => Number(b.ketQua === "BI_CHAN" && !b.daVuot) - Number(a.ketQua === "BI_CHAN" && !a.daVuot));
  const homNay = ngay === ngayVN();
  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  const choVao = rows.filter((r) => ["HOP_LE", "CANH_BAO", "VUOT_CHAN"].includes(r.ketQua)).length;
  return (
    <>
      {homNay && <LiveCheckins maxId={maxId} />}
      <PageHeader
        title="Check-in"
        sub={`${fmtNgay(ngay)} · ${choVao} lượt vào · ${rows.filter((r) => r.ketQua === "BI_CHAN").length} bị chặn`}
        action={coQuyen(u, "XUAT_EXCEL") ? <LinkButton variant="secondary" href={`/api/export/checkin?tu=${ngay}&den=${ngay}`}>Xuất Excel</LinkButton> : null}
      />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <CheckInHo lops={lops.map((l) => ({ id: l.l.id, ten: l.l.ten, coSoId: l.l.coSoId }))} canChonCoSo={u.vaiTro === "CHU" && !cs} />
        <Card>
          <CardHeader title="Danh sách lượt quét" sub={homNay ? "Tự cập nhật khi có lượt mới" : undefined} />
          <form className="grid grid-cols-2 gap-2 border-b border-line p-3 md:grid-cols-6">
            <Input name="q" defaultValue={sp.q} placeholder="Tên, mã khách, mã XN" className="col-span-2" />
            <Input type="date" name="ngay" defaultValue={ngay} />
            <Select name="lop" defaultValue={sp.lop ?? ""}>
              <option value="">Tất cả lớp</option>
              {lops.map((l) => (
                <option key={l.l.id} value={l.l.id}>
                  {l.l.ten}
                </option>
              ))}
            </Select>
            <Select name="gv" defaultValue={sp.gv ?? ""}>
              <option value="">Tất cả GV</option>
              {gvs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.ho_ten}
                </option>
              ))}
            </Select>
            <Select name="kq" defaultValue={sp.kq ?? ""}>
              <option value="">Mọi kết quả</option>
              <option value="HOP_LE">Hợp lệ</option>
              <option value="CANH_BAO">Cảnh báo</option>
              <option value="BI_CHAN">Bị chặn</option>
              <option value="VUOT_CHAN">Vượt chặn</option>
            </Select>
            <Select name="kenh" defaultValue={sp.kenh ?? ""} className="col-span-1">
              <option value="">Mọi kênh</option>
              {Object.entries(KENH).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Button variant="secondary" className="col-span-1">
              Lọc
            </Button>
          </form>
          {sorted.length === 0 ? (
            <Empty>Chưa có lượt check-in.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Giờ</Th>
                  <Th>Mã XN</Th>
                  <Th>Khách</Th>
                  <Th>Thẻ</Th>
                  <Th>Lượt còn</Th>
                  <Th>Khoá · Lớp · GV</Th>
                  {!cs && <Th>Cơ sở</Th>}
                  <Th>Kết quả</Th>
                  <Th>Kênh</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const xem = u.vaiTro === "CHU" || r.khachCoSoId === u.coSoId;
                  return (
                    <tr key={r.id} className={r.ketQua === "BI_CHAN" && !r.daVuot ? "bg-bad-soft/60" : ""}>
                      <Td className="tabular font-semibold">{fmtGio(r.thoiGian)}</Td>
                      <Td className="tabular text-base font-extrabold tracking-wider">{r.maXacNhan}</Td>
                      <Td>
                        {xem ? (
                          <Link href={`/admin/khach/${r.khachId}`} className="font-semibold hover:text-brand">
                            {r.hoTen}
                          </Link>
                        ) : (
                          <span className="font-semibold" title="Khách cơ sở khác: chỉ xem lượt này">
                            {r.hoTen}
                          </span>
                        )}
                        <div className="text-xs text-ink-3">
                          {r.maKh}
                          {r.loaiKhach === "MOI" && <span className="ml-1 font-bold text-ok">· Khách mới</span>}
                        </div>
                      </Td>
                      <Td>{r.the ?? "—"}</Td>
                      <Td className="tabular font-semibold">{r.soLuotConSau ?? (r.the ? "∞" : "—")}</Td>
                      <Td className="max-w-64 text-ink-2">
                        {[r.khoaHoc && `${r.khoaHoc}${r.soBuoiSau ? ` (buổi ${r.soBuoiSau})` : ""}`, r.lop, r.giaoVien].filter(Boolean).join(" · ") || "—"}
                      </Td>
                      {!cs && <Td>{r.coSo}</Td>}
                      <Td>
                        <KetQuaBadge ketQua={r.ketQua} mau={r.mau} />
                        {r.lyDoText && <div className="mt-0.5 max-w-52 text-xs text-ink-2">{r.lyDoText}</div>}
                      </Td>
                      <Td className="text-xs text-ink-2">
                        {KENH[r.kenh]}
                        {r.nguoiThaoTac && <div>{r.nguoiThaoTac}</div>}
                      </Td>
                      <Td>
                        {r.ketQua === "BI_CHAN" && !r.daVuot && homNay && (
                          <div className="flex flex-wrap gap-1">
                            {xem && (
                              <LinkButton size="sm" variant="secondary" href={`/admin/khach/${r.khachId}/ban-the`}>
                                Bán thẻ
                              </LinkButton>
                            )}
                            {coQuyen(u, "VUOT_CHAN") && <VuotChanButton id={r.id} ten={r.hoTen} />}
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
