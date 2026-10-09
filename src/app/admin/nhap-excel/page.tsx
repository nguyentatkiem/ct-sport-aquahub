import { canDangNhap, coQuyen } from "@/server/auth";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, LinkButton } from "@/components/ui";
import { NhapForm } from "./client";

export const metadata = { title: "Nhập Excel" };

export default async function NhapExcelPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "NHAP_EXCEL")) return <KhongCoQuyen />;
  return (
    <>
      <PageHeader title="Nhập khách cũ từ Excel" sub="Dùng khi chuyển từ sổ giấy/Excel cũ (mục 11.2). Có thể kèm số lượt và hạn thẻ giấy để tạo thẻ chuyển đổi." action={<LinkButton variant="secondary" href="/api/import-mau">Tải file mẫu</LinkButton>} />
      <Card className="max-w-4xl">
        <CardHeader title="Các bước" sub="1. Tải file mẫu · 2. Điền dữ liệu · 3. Kiểm tra · 4. Nhập (cả file hoặc không dòng nào)" />
        <NhapForm />
      </Card>
    </>
  );
}
