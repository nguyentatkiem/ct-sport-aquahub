import { asc } from "drizzle-orm";
import { db } from "@/db";
import { coSo, nguoiDung } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, Table, Th, Td, Badge } from "@/components/ui";
import { VAI_TRO } from "@/lib/labels";
import { NhanVienForm } from "./client";

export const metadata = { title: "Nhân viên" };

export default async function NhanVienPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "QUAN_LY_TAI_KHOAN")) return <KhongCoQuyen />;
  const [ds, css] = await Promise.all([db.select().from(nguoiDung).orderBy(asc(nguoiDung.vaiTro), asc(nguoiDung.hoTen)), db.select({ id: coSo.id, ten: coSo.ten }).from(coSo).orderBy(asc(coSo.id))]);
  return (
    <>
      <PageHeader title="Nhân viên & phân quyền" sub="3 vai trò đăng nhập: Chủ trung tâm, Quản lý cơ sở, Lễ tân. Giáo viên không có tài khoản. Quên mật khẩu: Chủ đặt lại tại đây." />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Họ tên</Th>
                <Th>Đăng nhập</Th>
                <Th>Vai trò</Th>
                <Th>Cơ sở</Th>
                <Th>Trạng thái</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {ds.map((n) => (
                <tr key={n.id}>
                  <Td className="font-semibold">{n.hoTen}</Td>
                  <Td className="text-sm">
                    {n.email}
                    {n.email && n.sdt ? <br /> : null}
                    {n.sdt}
                  </Td>
                  <Td>
                    <Badge tone={n.vaiTro === "CHU" ? "violet" : n.vaiTro === "QUAN_LY" ? "brand" : "muted"}>{VAI_TRO[n.vaiTro]}</Badge>
                  </Td>
                  <Td>{css.find((c) => c.id === n.coSoId)?.ten ?? "Tất cả"}</Td>
                  <Td>
                    {n.trangThai === "HOAT_DONG" ? <Badge tone="ok">Hoạt động</Badge> : <Badge tone="bad">Đã khoá</Badge>}
                    {n.khoaDen && n.khoaDen > new Date() && <div className="text-xs text-bad">Tạm khoá do sai mật khẩu</div>}
                  </Td>
                  <Td>
                    <NhanVienForm coSo={css} gt={{ id: n.id, hoTen: n.hoTen, email: n.email, sdt: n.sdt, vaiTro: n.vaiTro, coSoId: n.coSoId, trangThai: n.trangThai }} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Thêm nhân viên" />
          <NhanVienForm coSo={css} gt={{}} inline />
        </Card>
      </div>
    </>
  );
}
