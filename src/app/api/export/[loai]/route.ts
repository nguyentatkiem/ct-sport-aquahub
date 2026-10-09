// Xuất Excel (mục 9.1). Chủ, Quản lý (cơ sở mình). Mọi lần xuất ghi nhật ký vì file chứa SĐT và thông tin trẻ em.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { layNguoiDung, phamViCoSo, thongTinYeuCau } from "@/server/auth";
import { co } from "@/lib/permissions";
import { ghiNhatKy } from "@/server/audit";
import { taoFile, traFile, type Cot } from "@/server/excel";
import { dsCheckIn, dsSapHet } from "@/server/queries";
import { bc01, bc02, bc03, bc04, bc05, bc06, bc07 } from "@/server/reports";
import { congNgay, fmtNgay, fmtNgayGio, ngayVN, tinhTuoi } from "@/lib/time";
import { KET_QUA, KENH, LOAI_PHIEU, HINH_THUC, TRANG_THAI_KH, TRANG_THAI_TT } from "@/lib/labels";
import { json } from "@/server/http";

export async function GET(req: Request, { params }: { params: Promise<{ loai: string }> }) {
  const { loai } = await params;
  const u = await layNguoiDung();
  if (!u) return json({ loi: "Chưa đăng nhập" }, 401);
  if (!co(u.vaiTro, "XUAT_EXCEL")) return json({ loi: "Bạn không có quyền xuất Excel" }, 403);
  const cs = await phamViCoSo(u);
  const url = new URL(req.url);
  const den = url.searchParams.get("den") || ngayVN();
  const tu = url.searchParams.get("tu") || congNgay(den, -29);
  const csSql = (col: string) => (cs ? sql.raw(`and ${col} = ${Number(cs)}`) : sql``);
  let sheets: { ten: string; cot: Cot[]; dong: Record<string, unknown>[] }[] = [];
  let ten = "";

  if (loai === "khach") {
    const rows = (
      await db.execute(sql`
      select k.ma_kh, k.ho_ten, k.ngay_sinh, k.sdt, l.ho_ten as lh_ten, l.sdt as lh_sdt, l.quan_he, cs.ten as co_so, k.trang_thai, k.ngay_dang_ky, k.ghi_chu,
        (select string_agg(t.ten_san_pham || ' (còn ' || coalesce(t.so_luot_con_lai::text,'∞') || coalesce(', hạn ' || to_char(t.ngay_het_han,'DD/MM/YYYY'),'') || ')', '; ')
          from the_ve t where t.khach_hang_id = k.id and t.trang_thai='HOAT_DONG') as the,
        (select string_agg(g.ten_khoa_hoc, '; ') from ghi_danh g where g.khach_hang_id = k.id and g.trang_thai in ('DANG_HOC','DU_DIEU_KIEN_TOT_NGHIEP')) as khoa,
        (select coalesce(sum(d.con_no),0) from don_hang d where d.khach_hang_id = k.id) as con_no
      from khach_hang k join co_so cs on cs.id = k.co_so_id left join nguoi_lien_he l on l.id = k.nguoi_lien_he_id
      where k.gop_vao_id is null ${csSql("k.co_so_id")} order by k.ma_kh`)
    ).rows as Record<string, string>[];
    ten = `khach-hang-${ngayVN()}.xlsx`;
    sheets = [
      {
        ten: "Khách hàng",
        cot: [
          { key: "ma", header: "Mã khách" },
          { key: "ten", header: "Họ tên", width: 26 },
          { key: "ns", header: "Ngày sinh" },
          { key: "tuoi", header: "Tuổi" },
          { key: "sdt", header: "SĐT" },
          { key: "lh", header: "Người liên hệ", width: 22 },
          { key: "lhSdt", header: "SĐT liên hệ" },
          { key: "qh", header: "Quan hệ" },
          { key: "the", header: "Thẻ đang dùng", width: 40 },
          { key: "khoa", header: "Khoá học", width: 24 },
          { key: "no", header: "Còn nợ", money: true },
          { key: "cs", header: "Cơ sở" },
          { key: "tt", header: "Trạng thái" },
          { key: "dk", header: "Ngày đăng ký" },
          { key: "gc", header: "Ghi chú", width: 30 },
        ],
        dong: rows.map((r) => ({
          ma: r.ma_kh,
          ten: r.ho_ten,
          ns: fmtNgay(String(r.ngay_sinh).slice(0, 10)),
          tuoi: tinhTuoi(String(r.ngay_sinh).slice(0, 10)),
          sdt: r.sdt,
          lh: r.lh_ten,
          lhSdt: r.lh_sdt,
          qh: r.quan_he,
          the: r.the,
          khoa: r.khoa,
          no: Number(r.con_no),
          cs: r.co_so,
          tt: TRANG_THAI_KH[r.trang_thai],
          dk: fmtNgayGio(r.ngay_dang_ky),
          gc: r.ghi_chu,
        })),
      },
    ];
  } else if (loai === "checkin") {
    const rows = await dsCheckIn({ coSoId: cs, tuNgay: tu, denNgay: den, limit: 100000 });
    ten = `checkin-${tu}-${den}.xlsx`;
    sheets = [
      {
        ten: "Check-in",
        cot: [
          { key: "tg", header: "Thời gian", width: 18 },
          { key: "xn", header: "Mã XN" },
          { key: "ten", header: "Khách", width: 24 },
          { key: "ma", header: "Mã khách" },
          { key: "the", header: "Thẻ", width: 18 },
          { key: "con", header: "Lượt còn" },
          { key: "khoa", header: "Khoá học" },
          { key: "lop", header: "Lớp", width: 22 },
          { key: "gv", header: "Giáo viên" },
          { key: "cs", header: "Cơ sở" },
          { key: "kq", header: "Kết quả" },
          { key: "ld", header: "Lý do", width: 28 },
          { key: "kenh", header: "Kênh" },
          { key: "nv", header: "Người thao tác" },
        ],
        dong: rows.map((r) => ({
          tg: fmtNgayGio(r.thoiGian),
          xn: r.maXacNhan,
          ten: r.hoTen,
          ma: r.maKh,
          the: r.the,
          con: r.soLuotConSau,
          khoa: r.khoaHoc,
          lop: r.lop,
          gv: r.giaoVien,
          cs: r.coSo,
          kq: KET_QUA[r.ketQua],
          ld: r.lyDoText,
          kenh: KENH[r.kenh],
          nv: r.nguoiThaoTac,
        })),
      },
    ];
  } else if (loai === "the-ve") {
    const the = (
      await db.execute(sql`
      select t.ma_the, t.ten_san_pham, k.ma_kh, k.ho_ten, t.so_luot_goc, t.so_luot_da_dung, t.so_luot_con_lai, t.ngay_mua, t.ngay_het_han, t.trang_thai, t.la_chuyen_doi, cs.ten as co_so, d.trang_thai_tt
      from the_ve t join khach_hang k on k.id = t.khach_hang_id join co_so cs on cs.id = t.co_so_ban_id left join don_hang d on d.id = t.don_hang_id
      where true ${csSql("t.co_so_ban_id")} order by t.id`)
    ).rows as Record<string, string | number | null>[];
    const gd = (
      await db.execute(sql`
      select g.id, g.ten_khoa_hoc, k.ma_kh, k.ho_ten, l.ten as lop, gv.ho_ten as gv, g.so_buoi_da_hoc, g.so_buoi_tot_nghiep, g.trang_thai, g.ngay_ghi_danh, cs.ten as co_so
      from ghi_danh g join khach_hang k on k.id = g.khach_hang_id join lop_hoc l on l.id = g.lop_hoc_id left join giao_vien gv on gv.id = g.giao_vien_id join co_so cs on cs.id = g.co_so_id
      where true ${csSql("g.co_so_id")} order by g.id`)
    ).rows as Record<string, string | number | null>[];
    ten = `the-ve-ghi-danh-${ngayVN()}.xlsx`;
    sheets = [
      {
        ten: "Thẻ vé",
        cot: [
          { key: "ma_the", header: "Mã thẻ" },
          { key: "ten_san_pham", header: "Loại", width: 22 },
          { key: "ma_kh", header: "Mã khách" },
          { key: "ho_ten", header: "Khách", width: 24 },
          { key: "so_luot_goc", header: "Lượt gốc" },
          { key: "so_luot_da_dung", header: "Đã dùng" },
          { key: "so_luot_con_lai", header: "Còn" },
          { key: "ngay_mua", header: "Ngày mua" },
          { key: "ngay_het_han", header: "Hết hạn" },
          { key: "trang_thai", header: "Trạng thái" },
          { key: "tt", header: "Thanh toán" },
          { key: "cd", header: "Chuyển đổi" },
          { key: "co_so", header: "Cơ sở bán" },
        ],
        dong: the.map((r) => ({
          ...r,
          ngay_mua: fmtNgay(String(r.ngay_mua).slice(0, 10)),
          ngay_het_han: r.ngay_het_han ? fmtNgay(String(r.ngay_het_han).slice(0, 10)) : "",
          tt: r.trang_thai_tt ? TRANG_THAI_TT[String(r.trang_thai_tt)] : "",
          cd: r.la_chuyen_doi ? "Có" : "",
        })),
      },
      {
        ten: "Ghi danh",
        cot: [
          { key: "ten_khoa_hoc", header: "Khoá học", width: 22 },
          { key: "ma_kh", header: "Mã khách" },
          { key: "ho_ten", header: "Khách", width: 24 },
          { key: "lop", header: "Lớp", width: 24 },
          { key: "gv", header: "Giáo viên" },
          { key: "so_buoi_da_hoc", header: "Đã học" },
          { key: "so_buoi_tot_nghiep", header: "Tốt nghiệp" },
          { key: "trang_thai", header: "Trạng thái" },
          { key: "ngay_ghi_danh", header: "Ngày ghi danh" },
          { key: "co_so", header: "Cơ sở" },
        ],
        dong: gd.map((r) => ({ ...r, ngay_ghi_danh: fmtNgay(String(r.ngay_ghi_danh).slice(0, 10)) })),
      },
    ];
  } else if (loai === "phieu-thu") {
    const rows = (
      await db.execute(sql`
      select p.ma_phieu, p.thoi_gian, d.ma_don, d.ten_san_pham, k.ma_kh, k.ho_ten, p.loai, p.so_tien, p.hinh_thuc, nd.ho_ten as nguoi_thu, cs.ten as co_so, p.trang_thai, p.ly_do_huy, p.ghi_chu
      from phieu_thu p join don_hang d on d.id = p.don_hang_id join khach_hang k on k.id = p.khach_hang_id join co_so cs on cs.id = p.co_so_id left join nguoi_dung nd on nd.id = p.nguoi_thu_id
      where p.ngay_vn between ${tu} and ${den} ${csSql("p.co_so_id")} order by p.thoi_gian`)
    ).rows as Record<string, string>[];
    ten = `phieu-thu-${tu}-${den}.xlsx`;
    sheets = [
      {
        ten: "Phiếu thu",
        cot: [
          { key: "ma_phieu", header: "Số phiếu" },
          { key: "tg", header: "Thời gian", width: 18 },
          { key: "ma_don", header: "Mã đơn" },
          { key: "ten_san_pham", header: "Sản phẩm", width: 22 },
          { key: "ma_kh", header: "Mã khách" },
          { key: "ho_ten", header: "Khách", width: 24 },
          { key: "loai", header: "Loại" },
          { key: "so_tien", header: "Số tiền", money: true },
          { key: "hinh_thuc", header: "Hình thức" },
          { key: "nguoi_thu", header: "Người thu" },
          { key: "co_so", header: "Cơ sở" },
          { key: "trang_thai", header: "Trạng thái" },
          { key: "ly_do_huy", header: "Lý do huỷ" },
          { key: "ghi_chu", header: "Ghi chú" },
        ],
        dong: rows.map((r) => ({
          ...r,
          tg: fmtNgayGio(r.thoi_gian),
          loai: LOAI_PHIEU[r.loai],
          so_tien: r.loai === "HOAN_TIEN" ? -Number(r.so_tien) : Number(r.so_tien),
          hinh_thuc: HINH_THUC[r.hinh_thuc],
          trang_thai: r.trang_thai === "DA_HUY" ? "Đã huỷ" : "Hiệu lực",
        })),
      },
    ];
  } else if (loai === "sap-het") {
    const rows = await dsSapHet({ coSoId: cs });
    ten = `sap-het-${ngayVN()}.xlsx`;
    sheets = [
      {
        ten: "Sắp hết",
        cot: [
          { key: "ma_kh", header: "Mã khách" },
          { key: "ho_ten", header: "Khách", width: 24 },
          { key: "sdt", header: "SĐT" },
          { key: "ten_san_pham", header: "Thẻ", width: 20 },
          { key: "so_luot_con_lai", header: "Còn lượt" },
          { key: "con_ngay", header: "Còn ngày" },
          { key: "khoa_hoc", header: "Khoá học" },
          { key: "giao_vien", header: "Giáo viên" },
          { key: "co_so", header: "Cơ sở" },
          { key: "lien_he_ket_qua", header: "Đã gọi" },
        ],
        dong: rows as unknown as Record<string, unknown>[],
      },
    ];
  } else if (loai === "bao-cao") {
    const bc = url.searchParams.get("bc") ?? "bc01";
    const k = { tu, den, coSoId: cs };
    ten = `${bc}-${tu}-${den}.xlsx`;
    const auto = (rows: Record<string, unknown>[]) => ({
      cot: Object.keys(rows[0] ?? { trong: "" }).map((key) => ({ key, header: key.replace(/_/g, " ") })),
      dong: rows,
    });
    if (bc === "bc01") {
      const d = await bc01(k);
      sheets = [
        { ten: "Theo cơ sở", ...auto(d.theoCoSo) },
        { ten: "Theo ngày", ...auto(d.theoNgay) },
        { ten: "Theo lớp", ...auto(d.theoLop) },
      ];
    } else if (bc === "bc02") sheets = [{ ten: "Bán thẻ", ...auto(await bc02(k)) }];
    else if (bc === "bc03") {
      const d = await bc03(k);
      sheets = [
        { ten: "Ghi danh", ...auto(d.theoKhoa) },
        { ten: "Tốt nghiệp", ...auto(d.totNghiep) },
      ];
    } else if (bc === "bc04") {
      const d = await bc04(k);
      sheets = [
        { ten: "Doanh số", ...auto(d.doanhSo) },
        { ten: "Thực thu", ...auto(d.thucThu) },
        { ten: "Theo nhân viên", ...auto(d.theoNhanVien) },
      ];
    } else if (bc === "bc05") sheets = [{ ten: "Gia hạn", ...auto(await bc05(k)) }];
    else if (bc === "bc06") sheets = [{ ten: "Chốt ca", ...auto(await bc06(den, cs)) }];
    else sheets = [{ ten: "Giờ cao điểm", ...auto(await bc07(k)) }];
  } else {
    return json({ loi: "Loại file không hợp lệ" }, 404);
  }

  const buf = await taoFile(sheets);
  const info = await thongTinYeuCau();
  await ghiNhatKy(db, u, { module: "Xuất file", hanhDong: "XUAT_EXCEL", doiTuong: ten, giaTriMoi: { soDong: sheets.reduce((a, s) => a + s.dong.length, 0), coSoId: cs }, ...info });
  return traFile(buf, ten);
}
