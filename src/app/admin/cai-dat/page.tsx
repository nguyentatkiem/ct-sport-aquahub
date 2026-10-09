import { asc } from "drizzle-orm";
import { db } from "@/db";
import { coSo } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { docCaiDat } from "@/server/settings";
import { KhongCoQuyen } from "@/components/khong-quyen";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";
import { CaiDatForm, CoSoForm } from "./client";

export const metadata = { title: "Cài đặt" };

export default async function CaiDatPage() {
  const u = await canDangNhap();
  if (!coQuyen(u, "CAI_DAT")) return <KhongCoQuyen />;
  const [cd, css] = await Promise.all([docCaiDat(), db.select().from(coSo).orderBy(asc(coSo.id))]);
  return (
    <>
      <PageHeader title="Cài đặt" sub="Đổi cài đặt có hiệu lực ngay, không cần triển khai lại (FR-HT-04)" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-fit">
          <CardHeader title="Trung tâm và luật chung" />
          <CaiDatForm gt={cd} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Cơ sở" sub="Mã cơ sở 2 chữ cái là tiền tố mã khách (VD LT00125)" />
          <div className="divide-y divide-line">
            {css.map((c) => (
              <div key={c.id} className="p-4">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  {c.ten} <Badge tone="brand">{c.ma}</Badge> {c.trangThai !== "HOAT_DONG" && <Badge>Ngừng</Badge>}
                </div>
                <CoSoForm gt={c} />
              </div>
            ))}
            <div className="p-4">
              <div className="mb-2 font-bold">Thêm cơ sở</div>
              <CoSoForm gt={null} />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
