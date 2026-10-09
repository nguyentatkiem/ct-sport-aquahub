// Mô hình dữ liệu theo mục 4 của đặc tả. Tên bảng/cột giữ tiếng Việt không dấu để đối chiếu với tài liệu.
import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  date,
  timestamp,
  bigint,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const money = (name: string) => bigint(name, { mode: "number" });

export const coSo = pgTable("co_so", {
  id: serial("id").primaryKey(),
  ma: text("ma").notNull().unique(), // 2 chữ cái, dùng làm tiền tố mã khách
  ten: text("ten").notNull(),
  diaChi: text("dia_chi"),
  sdt: text("sdt"),
  choTuDangKy: boolean("cho_tu_dang_ky").notNull().default(true),
  trangThai: text("trang_thai").notNull().default("HOAT_DONG"), // HOAT_DONG | NGUNG
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const nguoiDung = pgTable("nguoi_dung", {
  id: serial("id").primaryKey(),
  hoTen: text("ho_ten").notNull(),
  sdt: text("sdt").unique(),
  email: text("email").unique(),
  matKhauHash: text("mat_khau_hash").notNull(),
  vaiTro: text("vai_tro").notNull(), // CHU | QUAN_LY | LE_TAN
  coSoId: integer("co_so_id").references(() => coSo.id),
  trangThai: text("trang_thai").notNull().default("HOAT_DONG"), // HOAT_DONG | KHOA
  soLanSai: integer("so_lan_sai").notNull().default(0),
  khoaDen: ts("khoa_den"),
  phienBan: integer("phien_ban").notNull().default(1), // tăng khi đổi mật khẩu để huỷ phiên cũ
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const giaoVien = pgTable("giao_vien", {
  id: serial("id").primaryKey(),
  hoTen: text("ho_ten").notNull(),
  sdt: text("sdt"),
  trangThai: text("trang_thai").notNull().default("DANG_LAM"), // DANG_LAM | NGHI
  ghiChu: text("ghi_chu"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const giaoVienCoSo = pgTable(
  "giao_vien_co_so",
  {
    giaoVienId: integer("giao_vien_id").notNull().references(() => giaoVien.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
  },
  (t) => [primaryKey({ columns: [t.giaoVienId, t.coSoId] })],
);

export const nguoiLienHe = pgTable(
  "nguoi_lien_he",
  {
    id: serial("id").primaryKey(),
    hoTen: text("ho_ten").notNull(),
    sdt: text("sdt").notNull(),
    quanHe: text("quan_he").notNull(), // BO | ME | ONG | BA | KHAC
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("nlh_sdt_idx").on(t.sdt)],
);

export const khachHang = pgTable(
  "khach_hang",
  {
    id: serial("id").primaryKey(),
    maKh: text("ma_kh").notNull().unique(),
    hoTen: text("ho_ten").notNull(),
    ngaySinh: date("ngay_sinh", { mode: "string" }).notNull(),
    sdt: text("sdt"),
    nguoiLienHeId: integer("nguoi_lien_he_id").references(() => nguoiLienHe.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
    ngayDangKy: ts("ngay_dang_ky").notNull().defaultNow(),
    nguonTao: text("nguon_tao").notNull(), // NV_NHAP | KHACH_TU_DANG_KY | NHAP_EXCEL
    trangThai: text("trang_thai").notNull(), // CHO_DUYET | HOAT_DONG | NGUNG
    ghiChu: text("ghi_chu"),
    ghiChuSucKhoe: text("ghi_chu_suc_khoe"),
    khoaHocMuonDangKyId: integer("khoa_hoc_muon_dang_ky_id"),
    qrToken: text("qr_token").notNull().unique(),
    dongYDuLieuLuc: ts("dong_y_du_lieu_luc"),
    timKiem: text("tim_kiem").notNull().default(""), // chuỗi không dấu để tìm nhanh
    gopVaoId: integer("gop_vao_id"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("kh_sdt_idx").on(t.sdt), index("kh_co_so_idx").on(t.coSoId), index("kh_lien_he_idx").on(t.nguoiLienHeId)],
);

export const sanPham = pgTable("san_pham", {
  id: serial("id").primaryKey(),
  loai: text("loai").notNull(), // KHOA_HOC | THE_VE
  ten: text("ten").notNull(),
  tenEn: text("ten_en"),
  giaNiemYet: money("gia_niem_yet").notNull(),
  coSoApDung: integer("co_so_ap_dung").array(), // null = tất cả
  trangThai: text("trang_thai").notNull().default("DANG_BAN"), // DANG_BAN | NGUNG_BAN
  // Thẻ vé
  soLuot: integer("so_luot"), // null = không giới hạn
  hanDungNgay: integer("han_dung_ngay"), // null = không hạn
  mocTinhHan: text("moc_tinh_han").notNull().default("NGAY_MUA"), // NGAY_MUA | LAN_DAU_CHECKIN
  luatChan: text("luat_chan").notNull().default("HET_LUOT_HOAC_HET_HAN"),
  hanhDongKhiViPham: text("hanh_dong_khi_vi_pham").notNull().default("CHAN"), // CHAN | CANH_BAO
  dungLienCoSo: boolean("dung_lien_co_so").notNull().default(false),
  toiDaLuotMoiNgay: integer("toi_da_luot_moi_ngay").notNull().default(1),
  nguongCanhBaoLuot: integer("nguong_canh_bao_luot").notNull().default(3),
  nguongCanhBaoNgay: integer("nguong_canh_bao_ngay").notNull().default(7),
  laTheChuyenDoi: boolean("la_the_chuyen_doi").notNull().default(false),
  // Cả hai
  choBaoLuu: boolean("cho_bao_luu").notNull().default(false),
  baoLuuToiDaNgay: integer("bao_luu_toi_da_ngay"),
  // Khoá học
  soBuoiHoc: integer("so_buoi_hoc"),
  soBuoiTotNghiep: integer("so_buoi_tot_nghiep"),
  theVeKemTheoId: integer("the_ve_kem_theo_id"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const lopHoc = pgTable("lop_hoc", {
  id: serial("id").primaryKey(),
  ten: text("ten").notNull(),
  coSoId: integer("co_so_id").notNull().references(() => coSo.id),
  sanPhamId: integer("san_pham_id").notNull().references(() => sanPham.id),
  giaoVienId: integer("giao_vien_id").references(() => giaoVien.id),
  lichText: text("lich_text"),
  trangThai: text("trang_thai").notNull().default("DANG_HOC"), // DANG_HOC | KET_THUC
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const maQr = pgTable("ma_qr", {
  id: serial("id").primaryKey(),
  loai: text("loai").notNull(), // LOP | QUAY
  ten: text("ten").notNull(),
  coSoId: integer("co_so_id").notNull().references(() => coSo.id),
  lopHocId: integer("lop_hoc_id").references(() => lopHoc.id),
  token: text("token").notNull().unique(),
  trangThai: text("trang_thai").notNull().default("HIEU_LUC"), // HIEU_LUC | HET_HIEU_LUC
  thayTheBoiId: integer("thay_the_boi_id"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const donHang = pgTable(
  "don_hang",
  {
    id: serial("id").primaryKey(),
    maDon: text("ma_don").notNull().unique(),
    khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
    loai: text("loai").notNull(), // THE_VE | KHOA_HOC
    sanPhamId: integer("san_pham_id").notNull().references(() => sanPham.id),
    tenSanPham: text("ten_san_pham").notNull(),
    giaNiemYet: money("gia_niem_yet").notNull(),
    giaThucThu: money("gia_thuc_thu").notNull(),
    lyDoGiam: text("ly_do_giam"),
    daThu: money("da_thu").notNull().default(0),
    conNo: money("con_no").notNull().default(0),
    trangThaiTt: text("trang_thai_tt").notNull(), // CHUA_THU | DA_COC | DA_THU_DU | DA_HOAN
    khongTinhDoanhSo: boolean("khong_tinh_doanh_so").notNull().default(false),
    ngayBan: date("ngay_ban", { mode: "string" }).notNull(),
    nguoiTaoId: integer("nguoi_tao_id").references(() => nguoiDung.id),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("dh_co_so_ngay_idx").on(t.coSoId, t.ngayBan), index("dh_khach_idx").on(t.khachHangId)],
);

export const theVe = pgTable(
  "the_ve",
  {
    id: serial("id").primaryKey(),
    maThe: text("ma_the").notNull().unique(),
    khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
    sanPhamId: integer("san_pham_id").notNull().references(() => sanPham.id),
    donHangId: integer("don_hang_id").references(() => donHang.id),
    coSoBanId: integer("co_so_ban_id").notNull().references(() => coSo.id),
    // Ảnh chụp luật từ sản phẩm tại lúc bán (BR-22)
    tenSanPham: text("ten_san_pham").notNull(),
    tenSanPhamEn: text("ten_san_pham_en"),
    soLuotGoc: integer("so_luot_goc"),
    soLuotConLai: integer("so_luot_con_lai"),
    soLuotDaDung: integer("so_luot_da_dung").notNull().default(0),
    hanDungNgay: integer("han_dung_ngay"),
    mocTinhHan: text("moc_tinh_han").notNull(),
    luatChan: text("luat_chan").notNull(),
    hanhDongKhiViPham: text("hanh_dong_khi_vi_pham").notNull(),
    dungLienCoSo: boolean("dung_lien_co_so").notNull(),
    coSoApDung: integer("co_so_ap_dung").array(),
    toiDaLuotMoiNgay: integer("toi_da_luot_moi_ngay").notNull(),
    nguongCanhBaoLuot: integer("nguong_canh_bao_luot").notNull(),
    nguongCanhBaoNgay: integer("nguong_canh_bao_ngay").notNull(),
    choBaoLuu: boolean("cho_bao_luu").notNull(),
    baoLuuToiDaNgay: integer("bao_luu_toi_da_ngay"),
    laChuyenDoi: boolean("la_chuyen_doi").notNull().default(false),
    // Thời hạn
    ngayMua: date("ngay_mua", { mode: "string" }).notNull(),
    ngayKichHoat: date("ngay_kich_hoat", { mode: "string" }),
    ngayHetHan: date("ngay_het_han", { mode: "string" }),
    soNgayDaBaoLuu: integer("so_ngay_da_bao_luu").notNull().default(0),
    baoLuuTu: date("bao_luu_tu", { mode: "string" }),
    baoLuuDen: date("bao_luu_den", { mode: "string" }),
    trangThai: text("trang_thai").notNull().default("HOAT_DONG"), // HOAT_DONG | HUY (HET_LUOT, HET_HAN, BAO_LUU tính khi đọc)
    anhTheGiay: text("anh_the_giay"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("tv_khach_idx").on(t.khachHangId)],
);

export const ghiDanh = pgTable(
  "ghi_danh",
  {
    id: serial("id").primaryKey(),
    khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
    sanPhamId: integer("san_pham_id").notNull().references(() => sanPham.id),
    donHangId: integer("don_hang_id").references(() => donHang.id),
    lopHocId: integer("lop_hoc_id").notNull().references(() => lopHoc.id),
    giaoVienId: integer("giao_vien_id").references(() => giaoVien.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
    tenKhoaHoc: text("ten_khoa_hoc").notNull(),
    ngayGhiDanh: date("ngay_ghi_danh", { mode: "string" }).notNull(),
    soBuoiHocGoc: integer("so_buoi_hoc_goc"),
    soBuoiTotNghiep: integer("so_buoi_tot_nghiep"),
    soBuoiDaHoc: integer("so_buoi_da_hoc").notNull().default(0),
    choBaoLuu: boolean("cho_bao_luu").notNull().default(false),
    baoLuuToiDaNgay: integer("bao_luu_toi_da_ngay"),
    baoLuuTu: date("bao_luu_tu", { mode: "string" }),
    baoLuuDen: date("bao_luu_den", { mode: "string" }),
    trangThai: text("trang_thai").notNull().default("DANG_HOC"), // DANG_HOC | BAO_LUU | DU_DIEU_KIEN_TOT_NGHIEP | TOT_NGHIEP | HUY
    ghiChu: text("ghi_chu"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("gd_khach_idx").on(t.khachHangId), index("gd_lop_idx").on(t.lopHocId)],
);

export const checkIn = pgTable(
  "check_in",
  {
    id: serial("id").primaryKey(),
    thoiGian: ts("thoi_gian").notNull().defaultNow(),
    ngayVn: date("ngay_vn", { mode: "string" }).notNull(),
    khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
    theVeId: integer("the_ve_id").references(() => theVe.id),
    lopHocId: integer("lop_hoc_id").references(() => lopHoc.id),
    ghiDanhId: integer("ghi_danh_id").references(() => ghiDanh.id),
    giaoVienId: integer("giao_vien_id").references(() => giaoVien.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
    maQrId: integer("ma_qr_id"),
    soLuotConSau: integer("so_luot_con_sau"),
    soBuoiSau: integer("so_buoi_sau"),
    ketQua: text("ket_qua").notNull(), // HOP_LE | BI_CHAN | CANH_BAO | VUOT_CHAN
    mau: text("mau").notNull(), // XANH | VANG | DO
    lyDo: text("ly_do"), // mã lý do
    lyDoText: text("ly_do_text"),
    truLuot: boolean("tru_luot").notNull().default(false),
    nguoiThaoTacId: integer("nguoi_thao_tac_id").references(() => nguoiDung.id),
    vuotChanTuId: integer("vuot_chan_tu_id"),
    kenh: text("kenh").notNull(), // KHACH_TU_QUET | LE_TAN | KIOSK
    maXacNhan: text("ma_xac_nhan").notNull(),
    loaiKhachTrongNgay: text("loai_khach_trong_ngay"), // MOI | CU
    canhBaoSapHet: text("canh_bao_sap_het"),
  },
  (t) => [
    index("ci_co_so_tg_idx").on(t.coSoId, t.thoiGian),
    index("ci_khach_tg_idx").on(t.khachHangId, t.thoiGian),
    index("ci_ngay_idx").on(t.ngayVn),
  ],
);

export const phieuThu = pgTable(
  "phieu_thu",
  {
    id: serial("id").primaryKey(),
    maPhieu: text("ma_phieu").notNull().unique(),
    donHangId: integer("don_hang_id").notNull().references(() => donHang.id),
    khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
    coSoId: integer("co_so_id").notNull().references(() => coSo.id),
    loai: text("loai").notNull(), // COC | THANH_TOAN | HOAN_TIEN
    soTien: money("so_tien").notNull(), // luôn dương; HOAN_TIEN là tiền trả ra
    hinhThuc: text("hinh_thuc").notNull(), // TIEN_MAT | CHUYEN_KHOAN
    thoiGian: ts("thoi_gian").notNull().defaultNow(),
    ngayVn: date("ngay_vn", { mode: "string" }).notNull(),
    nguoiThuId: integer("nguoi_thu_id").references(() => nguoiDung.id),
    ghiChu: text("ghi_chu"),
    trangThai: text("trang_thai").notNull().default("HIEU_LUC"), // HIEU_LUC | DA_HUY
    lyDoHuy: text("ly_do_huy"),
    nguoiHuyId: integer("nguoi_huy_id"),
    huyLuc: ts("huy_luc"),
  },
  (t) => [index("pt_co_so_ngay_idx").on(t.coSoId, t.ngayVn), index("pt_don_idx").on(t.donHangId)],
);

export const dieuChinh = pgTable("dieu_chinh", {
  id: serial("id").primaryKey(),
  theVeId: integer("the_ve_id").references(() => theVe.id),
  ghiDanhId: integer("ghi_danh_id").references(() => ghiDanh.id),
  loai: text("loai").notNull(), // CONG_LUOT | TRU_LUOT | CHUYEN_LUOT | GIA_HAN_NGAY | MO_KHOA | BAO_LUU | TOT_NGHIEP | HUY_THE
  soLuong: integer("so_luong"),
  theDichId: integer("the_dich_id"),
  giaTriCu: jsonb("gia_tri_cu"),
  giaTriMoi: jsonb("gia_tri_moi"),
  lyDo: text("ly_do").notNull(),
  nguoiThucHienId: integer("nguoi_thuc_hien_id").references(() => nguoiDung.id),
  thoiGian: ts("thoi_gian").notNull().defaultNow(),
});

export const lienHeCanhBao = pgTable("lien_he_canh_bao", {
  id: serial("id").primaryKey(),
  theVeId: integer("the_ve_id").notNull().references(() => theVe.id),
  khachHangId: integer("khach_hang_id").notNull().references(() => khachHang.id),
  nguoiGoiId: integer("nguoi_goi_id").references(() => nguoiDung.id),
  ketQua: text("ket_qua").notNull(), // DA_GOI | KHONG_NGHE | HEN_GOI_LAI | SE_GIA_HAN | KHONG_GIA_HAN
  ghiChu: text("ghi_chu"),
  thoiGian: ts("thoi_gian").notNull().defaultNow(),
});

export const nhatKy = pgTable(
  "nhat_ky",
  {
    id: serial("id").primaryKey(),
    thoiGian: ts("thoi_gian").notNull().defaultNow(),
    nguoiDungId: integer("nguoi_dung_id"),
    tenNguoiDung: text("ten_nguoi_dung"),
    vaiTro: text("vai_tro"),
    coSoId: integer("co_so_id"),
    module: text("module").notNull(),
    hanhDong: text("hanh_dong").notNull(),
    doiTuong: text("doi_tuong"),
    giaTriCu: jsonb("gia_tri_cu"),
    giaTriMoi: jsonb("gia_tri_moi"),
    lyDo: text("ly_do"),
    ip: text("ip"),
    thietBi: text("thiet_bi"),
  },
  (t) => [index("nk_tg_idx").on(t.thoiGian)],
);

export const caiDat = pgTable("cai_dat", {
  khoa: text("khoa").primaryKey(),
  giaTri: jsonb("gia_tri").notNull(),
});

export const boDem = pgTable(
  "bo_dem",
  {
    tienTo: text("tien_to").notNull(),
    nam: integer("nam").notNull(),
    giaTri: integer("gia_tri").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.tienTo, t.nam] })],
);

export const gioiHanTraCuu = pgTable(
  "gioi_han_tra_cuu",
  {
    khoa: text("khoa").notNull(),
    phut: integer("phut").notNull(),
    soLan: integer("so_lan").notNull().default(0),
  },
  (t) => [uniqueIndex("ghtc_khoa_phut").on(t.khoa, t.phut)],
);
