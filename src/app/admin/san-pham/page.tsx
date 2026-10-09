import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { coSo, sanPham } from "@/db/schema";
import { canDangNhap, coQuyen } from "@/server/auth";
import { Card, PageHeader, Table, Th, Td, Empty, Badge, LinkButton, Tabs } from "@/components/ui";
import { fmtTien } from "@/lib/text";
import { moTaLuat } from "@/lib/rule-text";
import { SpActions } from "./client";

export const metadata = { title: "Sản phẩm" };

export default async function SanPhamPage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const sp = await searchParams;
  const u = await canDangNhap();
  const sua = coQuyen(u, "SUA_SAN_PHAM");
  const loai = sp.loai ?? "THE_VE";
  const [ds, css] = await Promise.all([db.select().from(sanPham).orderBy(asc(sanPham.trangThai), desc(sanPham.id)), db.select().from(coSo)]);
  const tenCs = (ids: number[] | null) => (!ids || !ids.length ? "Tất cả cơ sở" : ids.map((i) => css.find((c) => c.id === i)?.ma ?? i).join(", "));
  const rows = ds.filter((s) => s.loai === loai);
  return (
    <>
      <PageHeader
        title="Sản phẩm"
        sub={sua ? "Tên, giá, số lượt, hạn dùng, luật chặn do trung tâm tự cấu hình. Sửa sản phẩm không làm đổi thẻ đã bán." : "Chỉ Chủ trung tâm được tạo/sửa sản phẩm."}
        action={
          sua && (
            <LinkButton href={`/admin/san-pham/moi?loai=${loai}`}>
              <Plus className="size-4" /> Thêm {loai === "THE_VE" ? "thẻ vé" : "khoá học"}
            </LinkButton>
          )
        }
      />
      <Tabs
        active={loai}
        items={[
          { key: "THE_VE", label: `Thẻ vé (${ds.filter((s) => s.loai === "THE_VE").length})`, href: "?loai=THE_VE" },
          { key: "KHOA_HOC", label: `Khoá học (${ds.filter((s) => s.loai === "KHOA_HOC").length})`, href: "?loai=KHOA_HOC" },
        ]}
      />
      <Card>
        {rows.length === 0 ? (
          <Empty>Chưa có sản phẩm.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tên</Th>
                <Th>Giá niêm yết</Th>
                <Th>Luật (xem trước)</Th>
                <Th>Cơ sở áp dụng</Th>
                <Th>Trạng thái</Th>
                {sua && <Th></Th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={s.trangThai === "NGUNG_BAN" ? "opacity-60" : ""}>
                  <Td>
                    {sua ? (
                      <Link href={`/admin/san-pham/${s.id}`} className="font-bold hover:text-brand">
                        {s.ten}
                      </Link>
                    ) : (
                      <span className="font-bold">{s.ten}</span>
                    )}
                    {s.tenEn && <div className="text-xs text-ink-3">{s.tenEn}</div>}
                  </Td>
                  <Td className="tabular font-semibold">{fmtTien(s.giaNiemYet)}</Td>
                  <Td className="max-w-[520px] text-sm text-ink-2">{moTaLuat(s)}</Td>
                  <Td>{tenCs(s.coSoApDung)}</Td>
                  <Td>{s.trangThai === "DANG_BAN" ? <Badge tone="ok">Đang bán</Badge> : <Badge>Ngừng bán</Badge>}</Td>
                  {sua && (
                    <Td>
                      <SpActions id={s.id} trangThai={s.trangThai} chuyenDoi={s.laTheChuyenDoi} />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
