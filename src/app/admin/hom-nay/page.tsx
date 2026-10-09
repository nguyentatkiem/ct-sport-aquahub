import { sql } from "drizzle-orm";
import { db } from "@/db";
import { canDangNhap, phamViCoSo } from "@/server/auth";
import { Card, PageHeader, Table, Th, Td, Empty } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { fmtNgay, ngayVN, thuVN } from "@/lib/time";

export const metadata = { title: "Khách hôm nay" };

/**
 * NFR-05: khi mất wifi quầy, lễ tân mở/in sẵn danh sách khách dự kiến hôm nay để đối chiếu bằng tay.
 * Gồm học viên các lớp có lịch hôm nay và khách đã vào trong 14 ngày qua, kèm lượt còn.
 */
export default async function HomNayPage() {
  const u = await canDangNhap();
  const cs = await phamViCoSo(u);
  const ngay = ngayVN();
  const rows = (
    await db.execute(sql`
    select distinct on (k.id) k.id, k.ma_kh, k.ho_ten, coalesce(k.sdt, l.sdt) as sdt,
      (select t.ten_san_pham || ' · còn ' || coalesce(t.so_luot_con_lai::text,'∞') || coalesce(' · hạn ' || to_char(t.ngay_het_han,'DD/MM'),'')
        from the_ve t where t.khach_hang_id = k.id and t.trang_thai='HOAT_DONG' order by t.ngay_het_han nulls last limit 1) as the,
      (select string_agg(lh.ten, ', ') from ghi_danh g join lop_hoc lh on lh.id = g.lop_hoc_id where g.khach_hang_id = k.id and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP')) as lop,
      cs.ten as co_so
    from khach_hang k
    join co_so cs on cs.id = k.co_so_id
    left join nguoi_lien_he l on l.id = k.nguoi_lien_he_id
    where k.trang_thai = 'HOAT_DONG' ${cs ? sql`and k.co_so_id = ${cs}` : sql``}
      and (exists (select 1 from check_in c where c.khach_hang_id = k.id and c.ngay_vn >= ${ngay}::date - 14)
        or exists (select 1 from ghi_danh g where g.khach_hang_id = k.id and g.trang_thai = 'DANG_HOC'))
    order by k.id`)
  ).rows as { id: number; ma_kh: string; ho_ten: string; sdt: string | null; the: string | null; lop: string | null; co_so: string }[];
  rows.sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, "vi"));
  const thu = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][thuVN(new Date())];
  return (
    <>
      <PageHeader title="Danh sách khách hôm nay" sub={`${thu}, ${fmtNgay(ngay)} · ${rows.length} khách · Dùng khi mất mạng: in sẵn đầu ca để đối chiếu`} action={<PrintButton label="In danh sách" />} />
      <Card>
        {rows.length === 0 ? (
          <Empty>Không có khách.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Mã</Th>
                <Th>Họ tên</Th>
                <Th>SĐT</Th>
                <Th>Thẻ đang dùng</Th>
                <Th>Lớp</Th>
                {!cs && <Th>Cơ sở</Th>}
                <Th>Đã vào (tick tay)</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <Td>{i + 1}</Td>
                  <Td className="font-semibold">{r.ma_kh}</Td>
                  <Td className="font-semibold">{r.ho_ten}</Td>
                  <Td>{r.sdt ?? "—"}</Td>
                  <Td>{r.the ?? <span className="text-bad">Không có thẻ</span>}</Td>
                  <Td className="text-ink-2">{r.lop ?? "—"}</Td>
                  {!cs && <Td>{r.co_so}</Td>}
                  <Td>☐</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
