// Truy vấn đọc cho các màn quản lý. Mọi hàm nhận coSoId (null = tất cả, chỉ Chủ được truyền null).
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  checkIn,
  coSo,
  donHang,
  ghiDanh,
  giaoVien,
  khachHang,
  lienHeCanhBao,
  lopHoc,
  nguoiDung,
  nguoiLienHe,
  phieuThu,
  sanPham,
  theVe,
} from "@/db/schema";
import { congNgay, ngayVN } from "@/lib/time";
import { khongDau, chuanSdt } from "@/lib/text";
import { trangThaiThe, type TheInput } from "@/lib/checkin-engine";

const CHO_VAO = ["HOP_LE", "CANH_BAO", "VUOT_CHAN"];

export type DongCheckIn = Awaited<ReturnType<typeof dsCheckIn>>[number];

export async function dsCheckIn(f: {
  coSoId: number | null;
  ngay?: string;
  tuNgay?: string;
  denNgay?: string;
  lopId?: number | null;
  gvId?: number | null;
  ketQua?: string | null;
  kenh?: string | null;
  q?: string | null;
  sauId?: number | null;
  limit?: number;
}) {
  const w: SQL[] = [];
  if (f.coSoId) w.push(eq(checkIn.coSoId, f.coSoId));
  if (f.ngay) w.push(eq(checkIn.ngayVn, f.ngay));
  if (f.tuNgay) w.push(gte(checkIn.ngayVn, f.tuNgay));
  if (f.denNgay) w.push(lte(checkIn.ngayVn, f.denNgay));
  if (f.lopId) w.push(eq(checkIn.lopHocId, f.lopId));
  if (f.gvId) w.push(eq(checkIn.giaoVienId, f.gvId));
  if (f.ketQua) w.push(eq(checkIn.ketQua, f.ketQua));
  if (f.kenh) w.push(eq(checkIn.kenh, f.kenh));
  if (f.sauId) w.push(gt(checkIn.id, f.sauId));
  if (f.q?.trim()) {
    const q = khongDau(f.q);
    w.push(or(ilike(khachHang.timKiem, `%${q}%`), ilike(checkIn.maXacNhan, `%${f.q.trim()}%`), ilike(khachHang.maKh, `%${f.q.trim()}%`))!);
  }
  return db
    .select({
      id: checkIn.id,
      thoiGian: checkIn.thoiGian,
      maXacNhan: checkIn.maXacNhan,
      ketQua: checkIn.ketQua,
      mau: checkIn.mau,
      lyDo: checkIn.lyDo,
      lyDoText: checkIn.lyDoText,
      kenh: checkIn.kenh,
      soLuotConSau: checkIn.soLuotConSau,
      soBuoiSau: checkIn.soBuoiSau,
      loaiKhach: checkIn.loaiKhachTrongNgay,
      vuotChanTuId: checkIn.vuotChanTuId,
      khachId: khachHang.id,
      khachCoSoId: khachHang.coSoId,
      hoTen: khachHang.hoTen,
      maKh: khachHang.maKh,
      the: theVe.tenSanPham,
      lop: lopHoc.ten,
      giaoVien: giaoVien.hoTen,
      khoaHoc: ghiDanh.tenKhoaHoc,
      coSo: coSo.ten,
      coSoId: checkIn.coSoId,
      nguoiThaoTac: nguoiDung.hoTen,
      daVuot: sql<boolean>`exists(select 1 from check_in v where v.vuot_chan_tu_id = ${checkIn.id})`,
    })
    .from(checkIn)
    .innerJoin(khachHang, eq(khachHang.id, checkIn.khachHangId))
    .innerJoin(coSo, eq(coSo.id, checkIn.coSoId))
    .leftJoin(theVe, eq(theVe.id, checkIn.theVeId))
    .leftJoin(lopHoc, eq(lopHoc.id, checkIn.lopHocId))
    .leftJoin(giaoVien, eq(giaoVien.id, checkIn.giaoVienId))
    .leftJoin(ghiDanh, eq(ghiDanh.id, checkIn.ghiDanhId))
    .leftJoin(nguoiDung, eq(nguoiDung.id, checkIn.nguoiThaoTacId))
    .where(w.length ? and(...w) : undefined)
    .orderBy(desc(checkIn.thoiGian), desc(checkIn.id))
    .limit(f.limit ?? 300);
}

/** Q1: số liệu hôm nay. */
export async function tongQuan(coSoId: number | null, ngay = ngayVN()) {
  const csCi = coSoId ? sql`and c.co_so_id = ${coSoId}` : sql``;
  const csDh = coSoId ? sql`and d.co_so_id = ${coSoId}` : sql``;
  const [ci] = (
    await db.execute(sql`
    select
      count(*) filter (where c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN'))::int as luot,
      count(*) filter (where c.loai_khach_trong_ngay = 'MOI')::int as moi,
      count(*) filter (where c.loai_khach_trong_ngay = 'CU')::int as cu,
      count(*) filter (where c.ket_qua = 'BI_CHAN')::int as chan,
      count(*) filter (where c.ket_qua = 'VUOT_CHAN')::int as vuot
    from check_in c where c.ngay_vn = ${ngay} ${csCi}`)
  ).rows as { luot: number; moi: number; cu: number; chan: number; vuot: number }[];
  const theXuat = (
    await db.execute(sql`
    select d.ten_san_pham as ten, count(*)::int as n from don_hang d
    where d.ngay_ban = ${ngay} and d.loai = 'THE_VE' and not d.khong_tinh_doanh_so ${csDh}
    group by 1 order by 2 desc`)
  ).rows as { ten: string; n: number }[];
  const ghiDanhKhoa = (
    await db.execute(sql`
    select d.ten_san_pham as ten, count(*)::int as n from don_hang d
    where d.ngay_ban = ${ngay} and d.loai = 'KHOA_HOC' ${csDh}
    group by 1 order by 2 desc`)
  ).rows as { ten: string; n: number }[];
  const [dt] = (
    await db.execute(sql`
    select
      coalesce(sum(d.gia_thuc_thu) filter (where d.loai='KHOA_HOC'),0)::bigint as ds_khoa,
      coalesce(sum(d.gia_thuc_thu) filter (where d.loai='THE_VE'),0)::bigint as ds_the
    from don_hang d where d.ngay_ban = ${ngay} and not d.khong_tinh_doanh_so ${csDh}`)
  ).rows as { ds_khoa: string; ds_the: string }[];
  const [tt] = (
    await db.execute(sql`
    select coalesce(sum(case when p.loai='HOAN_TIEN' then -p.so_tien else p.so_tien end),0)::bigint as thuc_thu
    from phieu_thu p where p.ngay_vn = ${ngay} and p.trang_thai='HIEU_LUC' ${coSoId ? sql`and p.co_so_id = ${coSoId}` : sql``}`)
  ).rows as { thuc_thu: string }[];
  const sapHet = await dsSapHet({ coSoId, ngay });
  const choDuyet = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(khachHang)
    .where(and(eq(khachHang.trangThai, "CHO_DUYET"), coSoId ? eq(khachHang.coSoId, coSoId) : undefined));
  return {
    ...ci,
    theXuat,
    tongTheXuat: theXuat.reduce((a, b) => a + b.n, 0),
    ghiDanhKhoa,
    tongGhiDanh: ghiDanhKhoa.reduce((a, b) => a + b.n, 0),
    dsKhoa: Number(dt.ds_khoa),
    dsThe: Number(dt.ds_the),
    thucThu: Number(tt.thuc_thu),
    sapHet: sapHet.length,
    choDuyet: choDuyet[0].n,
  };
}

/** Theo giờ trong ngày (biểu đồ nhỏ Q1). */
export async function luotTheoGio(coSoId: number | null, ngay = ngayVN()) {
  const rows = (
    await db.execute(sql`
    select extract(hour from c.thoi_gian at time zone 'Asia/Ho_Chi_Minh')::int as h, count(*)::int as n
    from check_in c where c.ngay_vn = ${ngay} and c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN')
    ${coSoId ? sql`and c.co_so_id = ${coSoId}` : sql``} group by 1 order by 1`)
  ).rows as { h: number; n: number }[];
  return rows;
}

type TheRow = typeof theVe.$inferSelect;
function theInput(t: TheRow): TheInput {
  return {
    ...t,
    daDatThanhToan: true,
    soLuotTruHomNay: 0,
    lanCuoiHomNay: null,
  } as unknown as TheInput;
}
export function trangThaiTheRow(t: TheRow, homNay = ngayVN()) {
  return trangThaiThe(theInput(t), homNay);
}

/** BR-12/13: thẻ sắp hết (chưa có thẻ mới còn hiệu lực). */
export async function dsSapHet(f: { coSoId: number | null; ngay?: string }) {
  const ngay = f.ngay ?? ngayVN();
  const rows = (
    await db.execute(sql`
    with the_hl as (
      select t.*, t.ngay_het_han as hh
      from the_ve t
      join khach_hang k on k.id = t.khach_hang_id
      where t.trang_thai = 'HOAT_DONG' and k.trang_thai = 'HOAT_DONG' and k.gop_vao_id is null
        ${f.coSoId ? sql`and (k.co_so_id = ${f.coSoId} or t.co_so_ban_id = ${f.coSoId})` : sql``}
    ),
    con_hl as (
      select * from the_hl
      where (so_luot_con_lai is null or so_luot_con_lai > 0) and (hh is null or hh >= ${ngay})
    )
    select t.id as the_id, t.ma_the, t.ten_san_pham, t.so_luot_con_lai, t.so_luot_goc, t.hh as ngay_het_han,
      (t.hh - ${ngay}::date) as con_ngay, k.id as khach_id, k.ma_kh, k.ho_ten, coalesce(k.sdt, l.sdt) as sdt, cs.ten as co_so,
      (select string_agg(distinct g.ten_khoa_hoc, ', ') from ghi_danh g where g.khach_hang_id = k.id and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP')) as khoa_hoc,
      (select string_agg(distinct gv.ho_ten, ', ') from ghi_danh g join giao_vien gv on gv.id = g.giao_vien_id where g.khach_hang_id = k.id and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP')) as giao_vien,
      lh.ket_qua as lien_he_ket_qua, lh.thoi_gian as lien_he_luc, lh.ghi_chu as lien_he_ghi_chu, nd.ho_ten as nguoi_goi
    from con_hl t
    join khach_hang k on k.id = t.khach_hang_id
    join co_so cs on cs.id = k.co_so_id
    left join nguoi_lien_he l on l.id = k.nguoi_lien_he_id
    left join lateral (select * from lien_he_canh_bao x where x.the_ve_id = t.id order by x.thoi_gian desc limit 1) lh on true
    left join nguoi_dung nd on nd.id = lh.nguoi_goi_id
    where ((t.so_luot_con_lai is not null and t.so_luot_con_lai <= t.nguong_canh_bao_luot)
       or (t.hh is not null and (t.hh - ${ngay}::date) <= t.nguong_canh_bao_ngay))
      and not exists (
        select 1 from con_hl o where o.khach_hang_id = t.khach_hang_id and o.id <> t.id
          and (o.so_luot_con_lai is null or o.so_luot_con_lai > o.nguong_canh_bao_luot)
          and (o.hh is null or (o.hh - ${ngay}::date) > o.nguong_canh_bao_ngay)
      )
    order by coalesce(t.so_luot_con_lai, 999), t.hh nulls last
    limit 500`)
  ).rows as {
    the_id: number;
    ma_the: string;
    ten_san_pham: string;
    so_luot_con_lai: number | null;
    so_luot_goc: number | null;
    ngay_het_han: string | null;
    con_ngay: number | null;
    khach_id: number;
    ma_kh: string;
    ho_ten: string;
    sdt: string | null;
    co_so: string;
    khoa_hoc: string | null;
    giao_vien: string | null;
    lien_he_ket_qua: string | null;
    lien_he_luc: string | null;
    lien_he_ghi_chu: string | null;
    nguoi_goi: string | null;
  }[];
  return rows.map((r) => ({ ...r, ngay_het_han: r.ngay_het_han ? String(r.ngay_het_han).slice(0, 10) : null }));
}

/** FR-CB-04: khách đã hết thẻ, chưa mua lại trong N ngày gần nhất. */
export async function dsHetTheChuaMua(coSoId: number | null, soNgay = 30) {
  const ngay = ngayVN();
  return (
    await db.execute(sql`
    with t as (
      select t.khach_hang_id, max(coalesce(t.ngay_het_han, t.ngay_mua)) as het, bool_or(
        t.trang_thai='HOAT_DONG' and (t.so_luot_con_lai is null or t.so_luot_con_lai > 0) and (t.ngay_het_han is null or t.ngay_het_han >= ${ngay})
      ) as con
      from the_ve t group by 1
    )
    select k.id as khach_id, k.ma_kh, k.ho_ten, coalesce(k.sdt, l.sdt) as sdt, cs.ten as co_so,
      (select max(c.thoi_gian) from check_in c where c.khach_hang_id = k.id and c.ket_qua in ('HOP_LE','CANH_BAO','VUOT_CHAN')) as lan_cuoi,
      (select max(d.ngay_ban) from don_hang d where d.khach_hang_id = k.id) as mua_cuoi
    from t join khach_hang k on k.id = t.khach_hang_id
    join co_so cs on cs.id = k.co_so_id
    left join nguoi_lien_he l on l.id = k.nguoi_lien_he_id
    where not t.con and k.trang_thai = 'HOAT_DONG'
      and not exists (select 1 from don_hang d where d.khach_hang_id = k.id and d.ngay_ban > ${congNgay(ngay, -soNgay)})
      ${coSoId ? sql`and k.co_so_id = ${coSoId}` : sql``}
    order by lan_cuoi desc nulls last limit 500`)
  ).rows as { khach_id: number; ma_kh: string; ho_ten: string; sdt: string | null; co_so: string; lan_cuoi: string | null; mua_cuoi: string | null }[];
}

/** Q3: danh sách khách. */
export async function dsKhach(f: { coSoId: number | null; q?: string; tab?: string; trang?: number }) {
  const w: SQL[] = [isNull(khachHang.gopVaoId)];
  if (f.coSoId) w.push(eq(khachHang.coSoId, f.coSoId));
  if (f.tab === "cho-duyet") w.push(eq(khachHang.trangThai, "CHO_DUYET"));
  else if (f.tab === "ngung") w.push(eq(khachHang.trangThai, "NGUNG"));
  else w.push(ne(khachHang.trangThai, "NGUNG"));
  const q = f.q?.trim();
  if (q) {
    const kd = khongDau(q);
    const sdt = chuanSdt(q);
    const ors: SQL[] = [ilike(khachHang.timKiem, `%${kd}%`)];
    if (sdt.length >= 3) ors.push(ilike(khachHang.timKiem, `%${sdt}%`));
    ors.push(sql`exists(select 1 from the_ve t where t.khach_hang_id = ${khachHang.id} and t.ma_the ilike ${"%" + q + "%"})`);
    w.push(or(...ors)!);
  }
  const trang = Math.max(1, f.trang ?? 1);
  const rows = await db
    .select({
      id: khachHang.id,
      maKh: khachHang.maKh,
      hoTen: khachHang.hoTen,
      ngaySinh: khachHang.ngaySinh,
      sdt: khachHang.sdt,
      trangThai: khachHang.trangThai,
      nguonTao: khachHang.nguonTao,
      ngayDangKy: khachHang.ngayDangKy,
      coSo: coSo.ten,
      lhTen: nguoiLienHe.hoTen,
      lhSdt: nguoiLienHe.sdt,
      lhQuanHe: nguoiLienHe.quanHe,
      khoaHocMuon: sanPham.ten,
      theDangDung: sql<string | null>`(select t.ten_san_pham || '|' || coalesce(t.so_luot_con_lai::text,'∞') || '|' || coalesce(t.ngay_het_han::text,'') from the_ve t
        where t.khach_hang_id = ${khachHang.id} and t.trang_thai='HOAT_DONG' and (t.so_luot_con_lai is null or t.so_luot_con_lai > 0)
        and (t.ngay_het_han is null or t.ngay_het_han >= ${ngayVN()}) order by t.ngay_het_han nulls last, t.id limit 1)`,
      khoaHoc: sql<string | null>`(select string_agg(g.ten_khoa_hoc || coalesce(' · ' || gv.ho_ten,''), ', ') from ghi_danh g left join giao_vien gv on gv.id = g.giao_vien_id
        where g.khach_hang_id = ${khachHang.id} and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP'))`,
      conNo: sql<number>`(select coalesce(sum(d.con_no),0)::bigint from don_hang d where d.khach_hang_id = ${khachHang.id})`,
    })
    .from(khachHang)
    .innerJoin(coSo, eq(coSo.id, khachHang.coSoId))
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .leftJoin(sanPham, eq(sanPham.id, khachHang.khoaHocMuonDangKyId))
    .where(and(...w))
    .orderBy(f.tab === "cho-duyet" ? asc(khachHang.ngayDangKy) : desc(khachHang.id))
    .limit(51)
    .offset((trang - 1) * 50);
  return { rows: rows.slice(0, 50).map((r) => ({ ...r, conNo: Number(r.conNo) })), coTiep: rows.length > 50, trang };
}

export async function demChoDuyet(coSoId: number | null) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(khachHang)
    .where(and(eq(khachHang.trangThai, "CHO_DUYET"), coSoId ? eq(khachHang.coSoId, coSoId) : undefined));
  return r.n;
}

/** Q4: chi tiết khách. */
export async function chiTietKhach(id: number) {
  const [k] = await db
    .select({ k: khachHang, cs: coSo, lh: nguoiLienHe, spMuon: sanPham })
    .from(khachHang)
    .innerJoin(coSo, eq(coSo.id, khachHang.coSoId))
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .leftJoin(sanPham, eq(sanPham.id, khachHang.khoaHocMuonDangKyId))
    .where(eq(khachHang.id, id));
  if (!k) return null;
  const [the, gd, don, phieu, ci, dc, anhEm] = await Promise.all([
    db
      .select({ t: theVe, d: donHang, cs: coSo })
      .from(theVe)
      .leftJoin(donHang, eq(donHang.id, theVe.donHangId))
      .innerJoin(coSo, eq(coSo.id, theVe.coSoBanId))
      .where(eq(theVe.khachHangId, id))
      .orderBy(desc(theVe.id)),
    db
      .select({ g: ghiDanh, l: lopHoc, gv: giaoVien, d: donHang })
      .from(ghiDanh)
      .innerJoin(lopHoc, eq(lopHoc.id, ghiDanh.lopHocId))
      .leftJoin(giaoVien, eq(giaoVien.id, ghiDanh.giaoVienId))
      .leftJoin(donHang, eq(donHang.id, ghiDanh.donHangId))
      .where(eq(ghiDanh.khachHangId, id))
      .orderBy(desc(ghiDanh.id)),
    db.select({ d: donHang, cs: coSo }).from(donHang).innerJoin(coSo, eq(coSo.id, donHang.coSoId)).where(eq(donHang.khachHangId, id)).orderBy(desc(donHang.id)),
    db
      .select({ p: phieuThu, nd: nguoiDung.hoTen, maDon: donHang.maDon, tenSp: donHang.tenSanPham })
      .from(phieuThu)
      .innerJoin(donHang, eq(donHang.id, phieuThu.donHangId))
      .leftJoin(nguoiDung, eq(nguoiDung.id, phieuThu.nguoiThuId))
      .where(eq(phieuThu.khachHangId, id))
      .orderBy(desc(phieuThu.id)),
    dsCheckInKhach(id),
    db.execute(sql`select dc.*, nd.ho_ten as nguoi, t.ma_the, t2.ma_the as ma_the_dich, g.ten_khoa_hoc
      from dieu_chinh dc left join nguoi_dung nd on nd.id = dc.nguoi_thuc_hien_id
      left join the_ve t on t.id = dc.the_ve_id left join the_ve t2 on t2.id = dc.the_dich_id
      left join ghi_danh g on g.id = dc.ghi_danh_id
      where t.khach_hang_id = ${id} or g.khach_hang_id = ${id} order by dc.thoi_gian desc limit 100`),
    k.lh
      ? db
          .select({ id: khachHang.id, hoTen: khachHang.hoTen, maKh: khachHang.maKh })
          .from(khachHang)
          .where(and(eq(khachHang.nguoiLienHeId, k.lh.id), ne(khachHang.id, id), isNull(khachHang.gopVaoId)))
      : Promise.resolve([]),
  ]);
  return { ...k, the, gd, don, phieu, ci, dc: dc.rows as Record<string, unknown>[], anhEm };
}

export async function dsCheckInKhach(id: number, thang?: string) {
  const w: SQL[] = [eq(checkIn.khachHangId, id)];
  if (thang) {
    w.push(gte(checkIn.ngayVn, thang + "-01"));
    w.push(lte(checkIn.ngayVn, thang + "-31"));
  }
  return db
    .select({
      id: checkIn.id,
      thoiGian: checkIn.thoiGian,
      ketQua: checkIn.ketQua,
      mau: checkIn.mau,
      lyDoText: checkIn.lyDoText,
      kenh: checkIn.kenh,
      maXacNhan: checkIn.maXacNhan,
      soLuotConSau: checkIn.soLuotConSau,
      soBuoiSau: checkIn.soBuoiSau,
      coSo: coSo.ten,
      lop: lopHoc.ten,
      giaoVien: giaoVien.hoTen,
      the: theVe.maThe,
    })
    .from(checkIn)
    .innerJoin(coSo, eq(coSo.id, checkIn.coSoId))
    .leftJoin(lopHoc, eq(lopHoc.id, checkIn.lopHocId))
    .leftJoin(giaoVien, eq(giaoVien.id, checkIn.giaoVienId))
    .leftJoin(theVe, eq(theVe.id, checkIn.theVeId))
    .where(and(...w))
    .orderBy(desc(checkIn.thoiGian))
    .limit(500);
}

/** FR-BH-05: đơn còn nợ. */
export async function dsCongNo(coSoId: number | null) {
  return db
    .select({ d: donHang, k: { id: khachHang.id, hoTen: khachHang.hoTen, maKh: khachHang.maKh, sdt: khachHang.sdt }, lhSdt: nguoiLienHe.sdt, cs: coSo.ten, nguoiTao: nguoiDung.hoTen })
    .from(donHang)
    .innerJoin(khachHang, eq(khachHang.id, donHang.khachHangId))
    .innerJoin(coSo, eq(coSo.id, donHang.coSoId))
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .leftJoin(nguoiDung, eq(nguoiDung.id, donHang.nguoiTaoId))
    .where(and(gt(donHang.conNo, 0), coSoId ? eq(donHang.coSoId, coSoId) : undefined))
    .orderBy(desc(donHang.conNo))
    .limit(500);
}

export async function dsPhieuThu(f: { coSoId: number | null; tu: string; den: string; loai?: string | null; nguoiThuId?: number | null; q?: string | null }) {
  const w: SQL[] = [gte(phieuThu.ngayVn, f.tu), lte(phieuThu.ngayVn, f.den)];
  if (f.coSoId) w.push(eq(phieuThu.coSoId, f.coSoId));
  if (f.loai) w.push(eq(phieuThu.loai, f.loai));
  if (f.nguoiThuId) w.push(eq(phieuThu.nguoiThuId, f.nguoiThuId));
  if (f.q?.trim()) {
    const q = f.q.trim();
    w.push(or(ilike(phieuThu.maPhieu, `%${q}%`), ilike(donHang.maDon, `%${q}%`), ilike(khachHang.timKiem, `%${khongDau(q)}%`))!);
  }
  return db
    .select({ p: phieuThu, maDon: donHang.maDon, tenSp: donHang.tenSanPham, k: { id: khachHang.id, hoTen: khachHang.hoTen, maKh: khachHang.maKh }, cs: coSo.ten, nguoiThu: nguoiDung.hoTen })
    .from(phieuThu)
    .innerJoin(donHang, eq(donHang.id, phieuThu.donHangId))
    .innerJoin(khachHang, eq(khachHang.id, phieuThu.khachHangId))
    .innerJoin(coSo, eq(coSo.id, phieuThu.coSoId))
    .leftJoin(nguoiDung, eq(nguoiDung.id, phieuThu.nguoiThuId))
    .where(and(...w))
    .orderBy(desc(phieuThu.thoiGian))
    .limit(1000);
}

export async function dsSanPhamBan(coSoId: number, loai: "THE_VE" | "KHOA_HOC") {
  return db
    .select()
    .from(sanPham)
    .where(
      and(
        eq(sanPham.loai, loai),
        eq(sanPham.trangThai, "DANG_BAN"),
        or(isNull(sanPham.coSoApDung), sql`${coSoId} = any(${sanPham.coSoApDung})`),
      ),
    )
    .orderBy(sanPham.laTheChuyenDoi, sanPham.ten);
}

export async function dsLopCoSo(coSoId: number | null, chiDangHoc = true) {
  return db
    .select({ l: lopHoc, gv: giaoVien, sp: sanPham, cs: coSo, soHv: sql<number>`(select count(*)::int from ghi_danh g where g.lop_hoc_id = ${lopHoc.id} and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP','BAO_LUU'))` })
    .from(lopHoc)
    .innerJoin(sanPham, eq(sanPham.id, lopHoc.sanPhamId))
    .innerJoin(coSo, eq(coSo.id, lopHoc.coSoId))
    .leftJoin(giaoVien, eq(giaoVien.id, lopHoc.giaoVienId))
    .where(and(coSoId ? eq(lopHoc.coSoId, coSoId) : undefined, chiDangHoc ? eq(lopHoc.trangThai, "DANG_HOC") : undefined))
    .orderBy(asc(coSo.id), asc(lopHoc.ten));
}

export async function dsGiaoVien(coSoId: number | null, chiDangLam = false) {
  const rows = (
    await db.execute(sql`
    select g.*, coalesce(array_agg(gc.co_so_id) filter (where gc.co_so_id is not null), '{}') as co_so_ids,
      (select count(*)::int from lop_hoc l where l.giao_vien_id = g.id and l.trang_thai='DANG_HOC') as so_lop
    from giao_vien g left join giao_vien_co_so gc on gc.giao_vien_id = g.id
    group by g.id order by g.trang_thai, g.ho_ten`)
  ).rows as { id: number; ho_ten: string; sdt: string | null; trang_thai: string; ghi_chu: string | null; co_so_ids: number[]; so_lop: number }[];
  return rows.filter((g) => (!coSoId || g.co_so_ids.includes(coSoId) || g.co_so_ids.length === 0) && (!chiDangLam || g.trang_thai === "DANG_LAM"));
}

export async function dsLienHe(theVeId: number) {
  return db
    .select({ x: lienHeCanhBao, nguoi: nguoiDung.hoTen })
    .from(lienHeCanhBao)
    .leftJoin(nguoiDung, eq(nguoiDung.id, lienHeCanhBao.nguoiGoiId))
    .where(eq(lienHeCanhBao.theVeId, theVeId))
    .orderBy(desc(lienHeCanhBao.thoiGian));
}

export { CHO_VAO, inArray };
