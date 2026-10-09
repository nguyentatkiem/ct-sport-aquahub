import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo, lopHoc, maQr } from "@/db/schema";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, Table, Th, Td, Empty, Badge, LinkButton } from "@/components/ui";
import { fmtNgayGio } from "@/lib/time";
import { QrActions, TaoQrForm } from "./client";

export const metadata = { title: "Mã QR" };

export default async function QrPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_LOP_GV_QR")) return <KhongCoQuyen />;
  const cs = await phamViCoSo(u);
  const [rows, css, lops] = await Promise.all([
    db
      .select({ q: maQr, cs: coSo.ten, lop: lopHoc.ten })
      .from(maQr)
      .innerJoin(coSo, eq(coSo.id, maQr.coSoId))
      .leftJoin(lopHoc, eq(lopHoc.id, maQr.lopHocId))
      .where(cs ? eq(maQr.coSoId, cs) : undefined)
      .orderBy(asc(maQr.trangThai), asc(maQr.coSoId), desc(maQr.id)),
    db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id)),
    db
      .select({ id: lopHoc.id, ten: lopHoc.ten })
      .from(lopHoc)
      .where(and(eq(lopHoc.trangThai, "DANG_HOC"), cs ? eq(lopHoc.coSoId, cs) : undefined)),
  ]);
  return (
    <>
      <PageHeader title="Mã QR lớp & quầy" sub="QR chỉ mở trang check-in của cơ sở/lớp, không chứa quyền check-in (BR-15). Đổi mã khi QR bị chụp mang ra ngoài." />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          {rows.length === 0 ? (
            <Empty>Chưa có mã QR.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Tên</Th>
                  <Th>Loại</Th>
                  {!cs && <Th>Cơ sở</Th>}
                  <Th>Tạo lúc</Th>
                  <Th>Trạng thái</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ q, cs: c, lop }) => (
                  <tr key={q.id} className={q.trangThai !== "HIEU_LUC" ? "opacity-50" : ""}>
                    <Td>
                      <span className="font-semibold">{q.ten}</span>
                      {lop && lop !== q.ten && <div className="text-xs text-ink-3">{lop}</div>}
                    </Td>
                    <Td>{q.loai === "LOP" ? <Badge tone="brand">QR lớp</Badge> : <Badge tone="violet">QR quầy</Badge>}</Td>
                    {!cs && <Td>{c}</Td>}
                    <Td className="tabular">{fmtNgayGio(q.createdAt)}</Td>
                    <Td>{q.trangThai === "HIEU_LUC" ? <Badge tone="ok">Hiệu lực</Badge> : <Badge>Hết hiệu lực</Badge>}</Td>
                    <Td>
                      {q.trangThai === "HIEU_LUC" && (
                        <div className="flex flex-wrap gap-1">
                          <LinkButton size="sm" href={`/admin/qr/${q.id}`}>
                            In A5
                          </LinkButton>
                          <Link href={`/c/${q.token}`} target="_blank" className="inline-flex h-9 items-center px-2 text-sm font-semibold text-brand">
                            Mở thử
                          </Link>
                          <QrActions id={q.id} />
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card className="h-fit">
          <CardHeader title="Tạo QR mới" />
          <TaoQrForm coSo={u.vaiTro === "CHU" ? css : null} lops={lops} />
        </Card>
      </div>
    </>
  );
}
