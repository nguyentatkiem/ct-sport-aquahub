// Báo cáo mục 9. Mỗi hàm trả số liệu theo từng cơ sở để Chủ so sánh 3 cơ sở cạnh nhau.
import { sql } from "drizzle-orm";
import { db } from "@/db";

type Ky = { tu: string; den: string; coSoId: number | null };
const loc = (col: string, cs: number | null) => (cs ? sql.raw(`and ${col} = ${Number(cs)}`) : sql``);

async function rows<T>(q: ReturnType<typeof sql>) {
  return (await db.execute(q)).rows as T[];
}

/** BC-01 Lượt đến. */
export async function bc01(k: Ky & { lopId?: number | null; gvId?: number | null }) {
  const ext = sql`${k.lopId ? sql`and c.lop_hoc_id = ${k.lopId}` : sql``} ${k.gvId ? sql`and c.giao_vien_id = ${k.gvId}` : sql``}`;
  const theoCoSo = await rows<{ co_so: string; vao: number; hop_le: number; canh_bao: number; moi: number; cu: number; chan: number; vuot: number }>(sql`
    select cs.ten as co_so,
      count(*) filter (where c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN'))::int as vao,
      count(*) filter (where c.ket_qua = 'HOP_LE')::int as hop_le,
      count(*) filter (where c.ket_qua = 'CANH_BAO')::int as canh_bao,
      count(*) filter (where c.loai_khach_trong_ngay = 'MOI')::int as moi,
      count(*) filter (where c.loai_khach_trong_ngay = 'CU')::int as cu,
      count(*) filter (where c.ket_qua = 'BI_CHAN')::int as chan,
      count(*) filter (where c.ket_qua = 'VUOT_CHAN')::int as vuot
    from check_in c join co_so cs on cs.id = c.co_so_id
    where c.ngay_vn between ${k.tu} and ${k.den} ${loc("c.co_so_id", k.coSoId)} ${ext}
    group by cs.id, cs.ten order by cs.id`);
  const theoNgay = await rows<{ ngay: string; vao: number; moi: number; chan: number }>(sql`
    select to_char(c.ngay_vn,'YYYY-MM-DD') as ngay,
      count(*) filter (where c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN'))::int as vao,
      count(*) filter (where c.loai_khach_trong_ngay = 'MOI')::int as moi,
      count(*) filter (where c.ket_qua = 'BI_CHAN')::int as chan
    from check_in c where c.ngay_vn between ${k.tu} and ${k.den} ${loc("c.co_so_id", k.coSoId)} ${ext}
    group by 1 order by 1`);
  const theoLop = await rows<{ lop: string; giao_vien: string | null; vao: number }>(sql`
    select coalesce(l.ten, '(Quét QR quầy)') as lop, gv.ho_ten as giao_vien, count(*)::int as vao
    from check_in c left join lop_hoc l on l.id = c.lop_hoc_id left join giao_vien gv on gv.id = c.giao_vien_id
    where c.ngay_vn between ${k.tu} and ${k.den} and c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN') ${loc("c.co_so_id", k.coSoId)} ${ext}
    group by 1, 2 order by 3 desc`);
  return { theoCoSo, theoNgay, theoLop };
}

/** BC-02 Bán thẻ vé: số mã thẻ xuất theo loại, doanh số. Thẻ chuyển đổi không tính. */
export async function bc02(k: Ky) {
  return rows<{ co_so: string; loai: string; so_the: number; doanh_so: string }>(sql`
    select cs.ten as co_so, d.ten_san_pham as loai, count(*)::int as so_the, coalesce(sum(d.gia_thuc_thu),0)::bigint as doanh_so
    from don_hang d join co_so cs on cs.id = d.co_so_id
    where d.loai = 'THE_VE' and not d.khong_tinh_doanh_so and d.ngay_ban between ${k.tu} and ${k.den} ${loc("d.co_so_id", k.coSoId)}
    group by cs.id, cs.ten, d.ten_san_pham order by cs.id, so_the desc`);
}

/** BC-03 Ghi danh khoá học. */
export async function bc03(k: Ky) {
  const theoKhoa = await rows<{ co_so: string; khoa: string; giao_vien: string | null; so_gd: number; doanh_so: string }>(sql`
    select cs.ten as co_so, g.ten_khoa_hoc as khoa, gv.ho_ten as giao_vien, count(*)::int as so_gd, coalesce(sum(d.gia_thuc_thu),0)::bigint as doanh_so
    from ghi_danh g join co_so cs on cs.id = g.co_so_id left join don_hang d on d.id = g.don_hang_id left join giao_vien gv on gv.id = g.giao_vien_id
    where g.ngay_ghi_danh between ${k.tu} and ${k.den} ${loc("g.co_so_id", k.coSoId)}
    group by cs.id, cs.ten, g.ten_khoa_hoc, gv.ho_ten order by cs.id, so_gd desc`);
  const totNghiep = await rows<{ co_so: string; du_dk: number; tot_nghiep: number; dang_hoc: number }>(sql`
    select cs.ten as co_so,
      count(*) filter (where g.trang_thai = 'DU_DIEU_KIEN_TOT_NGHIEP')::int as du_dk,
      count(*) filter (where g.trang_thai = 'TOT_NGHIEP')::int as tot_nghiep,
      count(*) filter (where g.trang_thai = 'DANG_HOC')::int as dang_hoc
    from ghi_danh g join co_so cs on cs.id = g.co_so_id where true ${loc("g.co_so_id", k.coSoId)}
    group by cs.id, cs.ten order by cs.id`);
  return { theoKhoa, totNghiep };
}

/** BC-04 Doanh thu: doanh số bán (theo ngày bán) và tiền thực thu (theo ngày thu, gồm cọc). */
export async function bc04(k: Ky & { nguoiThuId?: number | null }) {
  const doanhSo = await rows<{ co_so: string; ds_khoa: string; ds_the: string; so_don: number; con_no: string }>(sql`
    select cs.ten as co_so,
      coalesce(sum(d.gia_thuc_thu) filter (where d.loai='KHOA_HOC'),0)::bigint as ds_khoa,
      coalesce(sum(d.gia_thuc_thu) filter (where d.loai='THE_VE'),0)::bigint as ds_the,
      count(*)::int as so_don,
      coalesce(sum(d.con_no),0)::bigint as con_no
    from co_so cs left join don_hang d on d.co_so_id = cs.id and not d.khong_tinh_doanh_so and d.ngay_ban between ${k.tu} and ${k.den}
    where true ${loc("cs.id", k.coSoId)}
    group by cs.id, cs.ten order by cs.id`);
  const nv = k.nguoiThuId ? sql`and p.nguoi_thu_id = ${k.nguoiThuId}` : sql``;
  const thucThu = await rows<{ co_so: string; tien_mat: string; chuyen_khoan: string; coc: string; hoan: string; thu_khoa: string; thu_the: string }>(sql`
    select cs.ten as co_so,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where p.hinh_thuc='TIEN_MAT'),0)::bigint as tien_mat,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where p.hinh_thuc='CHUYEN_KHOAN'),0)::bigint as chuyen_khoan,
      coalesce(sum(p.so_tien) filter (where p.loai='COC'),0)::bigint as coc,
      coalesce(sum(p.so_tien) filter (where p.loai='HOAN_TIEN'),0)::bigint as hoan,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where d.loai='KHOA_HOC'),0)::bigint as thu_khoa,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where d.loai='THE_VE'),0)::bigint as thu_the
    from co_so cs left join phieu_thu p on p.co_so_id = cs.id and p.trang_thai='HIEU_LUC' and p.ngay_vn between ${k.tu} and ${k.den} ${nv}
    left join don_hang d on d.id = p.don_hang_id
    where true ${loc("cs.id", k.coSoId)}
    group by cs.id, cs.ten order by cs.id`);
  const theoNhanVien = await rows<{ nhan_vien: string; co_so: string; tien_mat: string; chuyen_khoan: string; so_phieu: number }>(sql`
    select coalesce(nd.ho_ten,'(không rõ)') as nhan_vien, cs.ten as co_so,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where p.hinh_thuc='TIEN_MAT'),0)::bigint as tien_mat,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where p.hinh_thuc='CHUYEN_KHOAN'),0)::bigint as chuyen_khoan,
      count(*)::int as so_phieu
    from phieu_thu p join co_so cs on cs.id = p.co_so_id left join nguoi_dung nd on nd.id = p.nguoi_thu_id
    where p.trang_thai='HIEU_LUC' and p.ngay_vn between ${k.tu} and ${k.den} ${loc("p.co_so_id", k.coSoId)} ${nv}
    group by 1, 2 order by 3 desc`);
  return { doanhSo, thucThu, theoNhanVien };
}

/** BC-05 Sắp hết và gia hạn: thẻ kết thúc trong kỳ, đã gọi, đã gia hạn (mua thẻ mới trong khoảng 14 ngày trước đến 30 ngày sau). */
export async function bc05(k: Ky) {
  return rows<{ co_so: string; ket_thuc: number; da_goi: number; gia_han: number }>(sql`
    with kt as (
      select t.id, t.khach_hang_id, k.co_so_id,
        coalesce(
          case when t.ngay_het_han between ${k.tu} and ${k.den} then t.ngay_het_han end,
          case when t.so_luot_con_lai is not null and t.so_luot_con_lai <= 0 then
            (select max(c.ngay_vn) from check_in c where c.the_ve_id = t.id) end
        ) as ngay_kt
      from the_ve t join khach_hang k on k.id = t.khach_hang_id
      where t.trang_thai <> 'HUY' and not t.la_chuyen_doi ${loc("k.co_so_id", k.coSoId)}
    ),
    trong_ky as (select * from kt where ngay_kt between ${k.tu} and ${k.den})
    select cs.ten as co_so,
      count(tk.id)::int as ket_thuc,
      count(tk.id) filter (where exists (select 1 from lien_he_canh_bao l where l.the_ve_id = tk.id))::int as da_goi,
      count(tk.id) filter (where exists (
        select 1 from the_ve t2 where t2.khach_hang_id = tk.khach_hang_id and t2.id <> tk.id and not t2.la_chuyen_doi
          and t2.ngay_mua between tk.ngay_kt - 14 and tk.ngay_kt + 30))::int as gia_han
    from co_so cs left join trong_ky tk on tk.co_so_id = cs.id
    where true ${loc("cs.id", k.coSoId)}
    group by cs.id, cs.ten order by cs.id`);
}

/** BC-06 Chốt ca: tiền mặt từng nhân viên thu trong ngày để đối chiếu két. */
export async function bc06(ngay: string, coSoId: number | null) {
  return rows<{ nhan_vien: string; co_so: string; tm_thu: string; tm_hoan: string; ck: string; so_phieu: number }>(sql`
    select coalesce(nd.ho_ten,'(không rõ)') as nhan_vien, cs.ten as co_so,
      coalesce(sum(p.so_tien) filter (where p.hinh_thuc='TIEN_MAT' and p.loai <> 'HOAN_TIEN'),0)::bigint as tm_thu,
      coalesce(sum(p.so_tien) filter (where p.hinh_thuc='TIEN_MAT' and p.loai = 'HOAN_TIEN'),0)::bigint as tm_hoan,
      coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end) filter (where p.hinh_thuc='CHUYEN_KHOAN'),0)::bigint as ck,
      count(*)::int as so_phieu
    from phieu_thu p join co_so cs on cs.id = p.co_so_id left join nguoi_dung nd on nd.id = p.nguoi_thu_id
    where p.trang_thai='HIEU_LUC' and p.ngay_vn = ${ngay} ${loc("p.co_so_id", coSoId)}
    group by 1, 2 order by 2, 1`);
}

/** BC-07 Giờ cao điểm: lượt vào theo khung giờ × thứ. */
export async function bc07(k: Ky) {
  return rows<{ thu: number; gio: number; n: number }>(sql`
    select extract(dow from c.thoi_gian at time zone 'Asia/Ho_Chi_Minh')::int as thu,
      extract(hour from c.thoi_gian at time zone 'Asia/Ho_Chi_Minh')::int as gio, count(*)::int as n
    from check_in c where c.ngay_vn between ${k.tu} and ${k.den} and c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN') ${loc("c.co_so_id", k.coSoId)}
    group by 1, 2`);
}
