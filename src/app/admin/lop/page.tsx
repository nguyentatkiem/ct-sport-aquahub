import Link from "next/link";
import { Plus } from "lucide-react";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsLopCoSo } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, PageHeader, Table, Th, Td, Empty, Badge, LinkButton } from "@/components/ui";

export const metadata = { title: "Lớp học" };

export default async function LopPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_LOP_GV_QR")) return <KhongCoQuyen />;
  const cs = await phamViCoSo(u);
  const rows = await dsLopCoSo(cs, false);
  return (
    <>
      <PageHeader
        title="Lớp học"
        sub="Mỗi lớp gắn 1 khoá học, 1 giáo viên và 1 mã QR lớp"
        action={
          <LinkButton href="/admin/lop/moi">
            <Plus className="size-4" /> Tạo lớp
          </LinkButton>
        }
      />
      <Card>
        {rows.length === 0 ? (
          <Empty>Chưa có lớp.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lớp</Th>
                <Th>Khoá học</Th>
                <Th>Giáo viên</Th>
                <Th>Lịch</Th>
                <Th>Học viên</Th>
                {!cs && <Th>Cơ sở</Th>}
                <Th>Trạng thái</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ l, gv, sp, cs: c, soHv }) => (
                <tr key={l.id}>
                  <Td>
                    <Link href={`/admin/lop/${l.id}`} className="font-bold hover:text-brand">
                      {l.ten}
                    </Link>
                  </Td>
                  <Td>{sp.ten}</Td>
                  <Td>{gv?.hoTen ?? "—"}</Td>
                  <Td className="text-ink-2">{l.lichText ?? "—"}</Td>
                  <Td className="tabular">{soHv}</Td>
                  {!cs && <Td>{c.ten}</Td>}
                  <Td>{l.trangThai === "DANG_HOC" ? <Badge tone="ok">Đang học</Badge> : <Badge>Kết thúc</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
