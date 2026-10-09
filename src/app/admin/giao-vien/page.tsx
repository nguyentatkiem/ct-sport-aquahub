import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { coSo } from "@/db/schema";
import { canDangNhap, coQuyen, phamViCoSo } from "@/server/auth";
import { dsGiaoVien } from "@/server/queries";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, PageHeader, Table, Th, Td, Empty, Badge, LinkButton } from "@/components/ui";

export const metadata = { title: "Giáo viên" };

export default async function GvPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_LOP_GV_QR")) return <KhongCoQuyen />;
  const cs = await phamViCoSo(u);
  const [rows, css] = await Promise.all([dsGiaoVien(cs), db.select().from(coSo).orderBy(asc(coSo.id))]);
  return (
    <>
      <PageHeader
        title="Giáo viên"
        sub="Giáo viên không có tài khoản đăng nhập ở v1, chỉ là danh mục để gắn vào lớp"
        action={
          <LinkButton href="/admin/giao-vien/moi">
            <Plus className="size-4" /> Thêm giáo viên
          </LinkButton>
        }
      />
      <Card>
        {rows.length === 0 ? (
          <Empty>Chưa có giáo viên.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Họ tên</Th>
                <Th>SĐT</Th>
                <Th>Cơ sở dạy</Th>
                <Th>Số lớp đang dạy</Th>
                <Th>Trạng thái</Th>
                <Th>Ghi chú</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <Td>
                    <Link href={`/admin/giao-vien/${g.id}`} className="font-bold hover:text-brand">
                      {g.ho_ten}
                    </Link>
                  </Td>
                  <Td>{g.sdt ?? "—"}</Td>
                  <Td>{g.co_so_ids.map((i) => css.find((c) => c.id === i)?.ten).join(", ") || "—"}</Td>
                  <Td className="tabular">{g.so_lop}</Td>
                  <Td>{g.trang_thai === "DANG_LAM" ? <Badge tone="ok">Đang làm</Badge> : <Badge>Nghỉ</Badge>}</Td>
                  <Td className="text-ink-2">{g.ghi_chu ?? ""}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
