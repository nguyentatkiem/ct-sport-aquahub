import { canDangNhap } from "@/server/auth";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { VAI_TRO } from "@/lib/labels";
import { DoiMatKhau } from "./client";

export const metadata = { title: "Tài khoản" };

export default async function TaiKhoanPage() {
  const u = await canDangNhap();
  return (
    <>
      <PageHeader title="Tài khoản của tôi" sub={`${u.hoTen} · ${VAI_TRO[u.vaiTro]}`} />
      <Card className="max-w-md">
        <CardHeader title="Đổi mật khẩu" sub="Đổi xong phải đăng nhập lại trên mọi thiết bị" />
        <DoiMatKhau />
      </Card>
    </>
  );
}
