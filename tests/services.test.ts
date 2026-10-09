// Ca kiểm thử 11.3 chạy trên Postgres thật (giao dịch, khoá dòng, snapshot, thanh toán).
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIn, ghiDanh, khachHang, theVe } from "@/db/schema";
import { resetDb, seedCoBan, capNhatSanPham } from "./helpers";
import { taoKhach, timKhachTrung, duyetKhach, gopHoSo } from "@/server/customers";
import { banTheVe, ghiDanhKhoaHoc, ghiNhanThu, huyPhieu } from "@/server/sales";
import { thucHienCheckIn, vuotChan } from "@/server/checkin";
import { baoLuuThe, dieuChinhThe, xacNhanTotNghiep } from "@/server/cards";
import { ghiCaiDat } from "@/server/settings";

let S: Awaited<ReturnType<typeof seedCoBan>>;
const T0 = new Date("2026-10-08T03:00:00Z"); // 10:00 giờ VN
const sau = (phut: number) => new Date(T0.getTime() + phut * 60000);
const ngaySau = (n: number) => new Date(T0.getTime() + n * 86400000);

async function taoBe(ten = "Nguyễn Minh Anh", coSoId?: number, sdtPh = "0912345678") {
  return taoKhach(
    { hoTen: ten, ngaySinh: "2018-05-01", lienHe: { hoTen: "Trần Thị Hoa", sdt: sdtPh, quanHe: "ME" }, coSoId: coSoId ?? S.cs1.id },
    { nguonTao: "NV_NHAP", user: S.ltLT },
  );
}

async function banVe(khachId: number, opts: Partial<Parameters<typeof banTheVe>[0]> = {}) {
  return banTheVe({
    khachHangId: khachId,
    sanPhamId: S.ve10.id,
    coSoId: S.cs1.id,
    giaThucThu: 500000,
    thu: { soTien: 500000, hinhThuc: "TIEN_MAT" },
    user: S.ltLT,
    now: T0,
    ...opts,
  });
}

const theCua = async (id: number) => (await db.select().from(theVe).where(eq(theVe.id, id)))[0];

beforeEach(async () => {
  await resetDb();
  S = await seedCoBan();
});

describe("Mã tự sinh (D3, FR-KH-01)", () => {
  it("không trùng khi nhiều cơ sở tạo khách cùng lúc", async () => {
    const tasks = Array.from({ length: 12 }, (_, i) => taoBe("Bé Số " + i, [S.cs1.id, S.cs2.id, S.cs3.id][i % 3], "09000000" + String(10 + i)));
    const ds = await Promise.all(tasks);
    const ma = ds.map((k) => k.maKh);
    expect(new Set(ma).size).toBe(12);
    expect(ma.filter((m) => m.startsWith("LT"))).toHaveLength(4);
    expect(ma).toContain("LT00001");
  });

  it("mã thẻ và mã đơn theo năm", async () => {
    const k = await taoBe();
    const { the, don } = await banVe(k.id);
    expect(the.maThe).toBe("TV2600001");
    expect(don.maDon).toBe("DH2600001");
  });

  it("dưới 18 tuổi bắt buộc người liên hệ", async () => {
    await expect(taoKhach({ hoTen: "Bé", ngaySinh: "2019-01-01", coSoId: S.cs1.id }, { nguonTao: "NV_NHAP", user: S.ltLT })).rejects.toThrow(/phụ huynh/);
  });
});

describe("BR-24/25 khách trùng và người liên hệ", () => {
  it("phát hiện trùng họ tên + ngày sinh + SĐT liên hệ, dùng chung người liên hệ", async () => {
    const a = await taoBe("Nguyễn Minh Anh");
    const b = await taoBe("Nguyễn Minh Bảo");
    expect(a.nguoiLienHeId).toBe(b.nguoiLienHeId);
    const trung = await timKhachTrung({ hoTen: "nguyen minh anh", ngaySinh: "2018-05-01", sdtLienHe: "0912 345 678" });
    expect(trung.map((x) => x.id)).toEqual([a.id]);
  });
});

describe("Check-in trên CSDL", () => {
  it("TC-01 + BR-14: trừ 1 lượt, có mã xác nhận 4 ký tự", async () => {
    const k = await taoBe();
    const { the } = await banVe(k.id);
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.mau).toBe("XANH");
    expect(r.maXacNhan).toMatch(/^[A-Z2-9]{4}$/);
    expect((await theCua(the.id)).soLuotConLai).toBe(9);
    expect(r.the?.conLai).toBe(9);
  });

  it("TC-07: 2 điện thoại quét cùng thẻ cùng lúc chỉ trừ 1 lượt", async () => {
    const k = await taoBe();
    const { the } = await banVe(k.id);
    const rs = await Promise.all(
      Array.from({ length: 5 }, () => thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 })),
    );
    expect((await theCua(the.id)).soLuotConLai).toBe(9);
    const rows = await db.select().from(checkIn).where(eq(checkIn.khachHangId, k.id));
    expect(rows).toHaveLength(1);
    expect(rs.filter((r) => r.trungLap)).toHaveLength(4);
  });

  it("TC-06: quét lại sau 10 phút trong ngày → đã check-in, không trừ", async () => {
    const k = await taoBe();
    const { the } = await banVe(k.id);
    await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    const r2 = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: sau(10) });
    expect(r2.ketQua).toBe("DA_CHECKIN");
    expect(r2.lanCheckinTruoc).toBe(T0.toISOString());
    expect((await theCua(the.id)).soLuotConLai).toBe(9);
    const r3 = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: ngaySau(1) });
    expect(r3.ketQua).toBe("HOP_LE");
    expect((await theCua(the.id)).soLuotConLai).toBe(8);
  });

  it("TC-10: QR lớp có ghi danh → trừ 1 lượt thẻ, buổi học +1, hiện giáo viên", async () => {
    const k = await taoBe();
    await banVe(k.id);
    const { ghiDanh: gd } = await ghiDanhKhoaHoc({
      khachHangId: k.id,
      sanPhamId: S.khoa.id,
      lopHocId: S.lop.id,
      coSoId: S.cs1.id,
      giaThucThu: 2500000,
      thu: { soTien: 2500000, hinhThuc: "CHUYEN_KHOAN" },
      user: S.ltLT,
      now: T0,
    });
    await db.update(ghiDanh).set({ soBuoiDaHoc: 4 }).where(eq(ghiDanh.id, gd.id));
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, lopHocId: S.lop.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.mau).toBe("XANH");
    expect(r.the?.conLai).toBe(9);
    expect(r.ghiDanh).toMatchObject({ buoi: 5, tong: 12 });
    expect(r.lop?.giaoVien).toBe("Thầy Hùng");
  });

  it("A1: quét QR quầy không cộng buổi học", async () => {
    const k = await taoBe();
    await banVe(k.id);
    const { ghiDanh: gd } = await ghiDanhKhoaHoc({ khachHangId: k.id, sanPhamId: S.khoa.id, lopHocId: S.lop.id, coSoId: S.cs1.id, giaThucThu: 2500000, user: S.ltLT, now: T0 });
    await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect((await db.select().from(ghiDanh).where(eq(ghiDanh.id, gd.id)))[0].soBuoiDaHoc).toBe(0);
  });

  it("BR-27: đủ buổi → đủ điều kiện tốt nghiệp, quản lý xác nhận", async () => {
    const k = await taoBe();
    await banVe(k.id);
    const { ghiDanh: gd } = await ghiDanhKhoaHoc({ khachHangId: k.id, sanPhamId: S.khoa.id, lopHocId: S.lop.id, coSoId: S.cs1.id, giaThucThu: 2500000, user: S.ltLT, now: T0 });
    await db.update(ghiDanh).set({ soBuoiDaHoc: 11 }).where(eq(ghiDanh.id, gd.id));
    await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, lopHocId: S.lop.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect((await db.select().from(ghiDanh).where(eq(ghiDanh.id, gd.id)))[0].trangThai).toBe("DU_DIEU_KIEN_TOT_NGHIEP");
    await expect(xacNhanTotNghiep({ ghiDanhId: gd.id, user: S.ltLT })).rejects.toThrow();
    await xacNhanTotNghiep({ ghiDanhId: gd.id, user: S.qlLT });
    expect((await db.select().from(ghiDanh).where(eq(ghiDanh.id, gd.id)))[0].trangThai).toBe("TOT_NGHIEP");
  });

  it("TC-11: SĐT phụ huynh có 2 con, cả 2 check-in → 2 lượt, 2 thẻ trừ riêng", async () => {
    const a = await taoBe("Nguyễn Minh Anh");
    const b = await taoBe("Nguyễn Minh Bảo");
    const ta = (await banVe(a.id)).the;
    const tb = (await banVe(b.id)).the;
    const [ra, rb] = await Promise.all([
      thucHienCheckIn({ khachHangId: a.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 }),
      thucHienCheckIn({ khachHangId: b.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 }),
    ]);
    expect(ra.mau).toBe("XANH");
    expect(rb.mau).toBe("XANH");
    expect((await theCua(ta.id)).soLuotConLai).toBe(9);
    expect((await theCua(tb.id)).soLuotConLai).toBe(9);
  });

  it("TC-12: khách tự đăng ký chưa duyệt → vàng, không có lượt hợp lệ; duyệt rồi bán thì vào được", async () => {
    const k = await taoKhach(
      { hoTen: "Lê Văn Tự", ngaySinh: "1990-01-01", sdt: "0988000111", coSoId: S.cs1.id, dongYDuLieu: true },
      { nguonTao: "KHACH_TU_DANG_KY", user: null },
    );
    expect(k.trangThai).toBe("CHO_DUYET");
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.mau).toBe("VANG");
    expect(r.ketQua).toBe("BI_CHAN");
    await expect(banVe(k.id)).rejects.toThrow(/chờ duyệt/);
    await duyetKhach(k.id, S.ltLT);
    await banVe(k.id);
    expect((await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: ngaySau(1) })).mau).toBe("XANH");
  });

  it("TC-13: thẻ chưa cọc, cấu hình đã cọc → vàng; thu cọc xong vào được", async () => {
    await ghiCaiDat(db, "theDuocDungKhi", "DA_COC");
    const k = await taoBe();
    const { don } = await banVe(k.id, { thu: null });
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.mau).toBe("VANG");
    expect(r.lyDo).toBe("CHUA_THANH_TOAN");
    await ghiNhanThu({ donHangId: don.id, loai: "COC", thu: { soTien: 100000, hinhThuc: "TIEN_MAT" }, user: S.ltLT, now: T0 });
    expect((await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: ngaySau(1) })).mau).toBe("XANH");
  });

  it("TC-09: thẻ chỉ dùng ở cơ sở bán, quét ở cơ sở khác → đỏ", async () => {
    const k = await taoBe();
    await banVe(k.id);
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs3.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.mau).toBe("DO");
    expect(r.lyDo).toBe("SAI_CO_SO");
  });

  it("TC-14: bảo lưu 10 ngày → bị chặn trong kỳ; hết kỳ hạn lùi đúng 10 ngày", async () => {
    const k = await taoBe();
    const { the } = await banVe(k.id);
    const hanCu = the.ngayHetHan!;
    await expect(baoLuuThe({ theVeId: the.id, tu: "2026-10-08", den: "2026-10-17", lyDo: "Ốm", user: S.ltLT, now: T0 })).rejects.toThrow();
    await baoLuuThe({ theVeId: the.id, tu: "2026-10-08", den: "2026-10-17", lyDo: "Ốm", user: S.qlLT, now: T0 });
    const sauBl = await theCua(the.id);
    expect(sauBl.soNgayDaBaoLuu).toBe(10);
    expect(sauBl.ngayHetHan).toBe("2026-12-16");
    expect(hanCu).toBe("2026-12-06");
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: ngaySau(3) });
    expect(r.lyDo).toBe("BAO_LUU");
    const r2 = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: ngaySau(10) });
    expect(r2.mau).toBe("XANH");
    await expect(baoLuuThe({ theVeId: the.id, tu: "2026-10-20", den: "2026-11-10", lyDo: "x", user: S.qlLT, now: ngaySau(10) })).rejects.toThrow(/tối đa/);
  });

  it("TC-16: sửa giá và số lượt sản phẩm sau khi bán không đổi thẻ đã bán", async () => {
    const ks = await Promise.all([1, 2, 3, 4, 5].map((i) => taoBe("Bé " + i, undefined, "091000000" + i)));
    const ts = [];
    for (const k of ks) ts.push((await banVe(k.id)).the);
    await capNhatSanPham(S.ve10.id, { giaNiemYet: 900000, soLuot: 20, hanDungNgay: 10, luatChan: "CHI_HET_HAN" });
    for (const t of ts) {
      const x = await theCua(t.id);
      expect(x.soLuotGoc).toBe(10);
      expect(x.hanDungNgay).toBe(60);
      expect(x.luatChan).toBe("HET_LUOT_HOAC_HET_HAN");
    }
  });

  it("Vượt chặn: lễ tân không được, quản lý được, không trừ lượt", async () => {
    const k = await taoBe();
    const { the } = await banVe(k.id);
    await db.update(theVe).set({ soLuotConLai: 0 }).where(eq(theVe.id, the.id));
    const r = await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "KHACH_TU_QUET", now: T0 });
    expect(r.ketQua).toBe("BI_CHAN");
    await expect(vuotChan({ checkInId: r.checkInId!, lyDo: "Quên thẻ", user: S.ltLT })).rejects.toThrow(/Lễ tân/);
    await expect(vuotChan({ checkInId: r.checkInId!, lyDo: "Quên thẻ", user: S.qlCG })).rejects.toThrow(/cơ sở khác/);
    const v = await vuotChan({ checkInId: r.checkInId!, lyDo: "Khách hứa mua thẻ chiều nay", user: S.qlLT, now: sau(1) });
    expect(v.ketQua).toBe("VUOT_CHAN");
    expect((await theCua(the.id)).soLuotConLai).toBe(0);
  });
});

describe("Bán hàng và thu tiền", () => {
  it("TC-17: bán 2.500.000, cọc 500.000 rồi thu 2.000.000 → đã cọc → đã thu đủ", async () => {
    const k = await taoBe();
    const { don } = await ghiDanhKhoaHoc({
      khachHangId: k.id,
      sanPhamId: S.khoa.id,
      lopHocId: S.lop.id,
      coSoId: S.cs1.id,
      giaThucThu: 2500000,
      thu: { soTien: 500000, hinhThuc: "TIEN_MAT" },
      user: S.ltLT,
      now: T0,
    });
    const r1 = await ghiNhanThu({ donHangId: don.id, loai: "THANH_TOAN", thu: { soTien: 0.5e6, hinhThuc: "TIEN_MAT" }, user: S.ltLT, now: T0 });
    expect(r1.trangThaiTt).toBe("DA_COC");
    expect(r1.conNo).toBe(1500000);
    const r2 = await ghiNhanThu({ donHangId: don.id, loai: "THANH_TOAN", thu: { soTien: 1.5e6, hinhThuc: "CHUYEN_KHOAN" }, user: S.ltLT, now: T0 });
    expect(r2.trangThaiTt).toBe("DA_THU_DU");
    expect(r2.conNo).toBe(0);
    await expect(ghiNhanThu({ donHangId: don.id, loai: "THANH_TOAN", thu: { soTien: 1, hinhThuc: "TIEN_MAT" }, user: S.ltLT })).rejects.toThrow(/còn nợ/);
    // Huỷ phiếu (BR-20): lễ tân không được, quản lý được, còn nợ tính lại
    await expect(huyPhieu({ phieuId: r2.phieu.id, lyDo: "Nhập nhầm", user: S.ltLT })).rejects.toThrow();
    const h = await huyPhieu({ phieuId: r2.phieu.id, lyDo: "Nhập nhầm", user: S.qlLT });
    expect(h.conNo).toBe(1500000);
    expect(h.trangThaiTt).toBe("DA_COC");
    // Hoàn tiền
    const hoan = await ghiNhanThu({ donHangId: don.id, loai: "HOAN_TIEN", thu: { soTien: 1e6, hinhThuc: "TIEN_MAT", ghiChu: "Khách nghỉ học" }, user: S.qlLT });
    expect(hoan.trangThaiTt).toBe("DA_HOAN");
  });

  it("BR-17: giảm giá thiếu lý do bị từ chối", async () => {
    const k = await taoBe();
    await expect(banVe(k.id, { giaThucThu: 400000, thu: null })).rejects.toThrow(/lý do/);
    const { don } = await banVe(k.id, { giaThucThu: 400000, lyDoGiam: "Gia đình 3 người", thu: null });
    expect(don.lyDoGiam).toBe("Gia đình 3 người");
    expect(don.trangThaiTt).toBe("CHUA_THU");
  });

  it("FR-BH-02: ghi danh và bán kèm thẻ trong 1 thao tác", async () => {
    const k = await taoBe();
    const r = await ghiDanhKhoaHoc({
      khachHangId: k.id,
      sanPhamId: S.khoa.id,
      lopHocId: S.lop.id,
      coSoId: S.cs1.id,
      giaThucThu: 2500000,
      banKem: { sanPhamId: S.ve10.id, giaThucThu: 500000, thu: { soTien: 500000, hinhThuc: "TIEN_MAT" } },
      user: S.ltLT,
      now: T0,
    });
    expect(r.kem?.the.maThe).toMatch(/^TV26/);
    expect(r.ghiDanh.soBuoiTotNghiep).toBe(12);
  });

  it("Thẻ chuyển đổi: giá 0, không tính doanh số, giữ lượt và hạn thẻ giấy", async () => {
    const [cd] = await db
      .insert((await import("@/db/schema")).sanPham)
      .values({ loai: "THE_VE", ten: "Thẻ chuyển đổi", giaNiemYet: 0, laTheChuyenDoi: true, trangThai: "NGUNG_BAN" })
      .returning();
    const k = await taoBe();
    const { the, don } = await banTheVe({ khachHangId: k.id, sanPhamId: cd.id, coSoId: S.cs1.id, giaThucThu: 0, soLuotChuyenDoi: 7, ngayHetHanChuyenDoi: "2026-12-31", user: S.ltLT, now: T0 });
    expect(the.soLuotConLai).toBe(7);
    expect(the.ngayHetHan).toBe("2026-12-31");
    expect(don.khongTinhDoanhSo).toBe(true);
    expect((await thucHienCheckIn({ khachHangId: k.id, coSoId: S.cs1.id, kenh: "LE_TAN", nguoiThaoTac: S.ltLT, now: T0 })).the?.conLai).toBe(6);
  });
});

describe("Điều chỉnh, phân quyền, gộp hồ sơ", () => {
  it("BR-16: cộng/trừ/chuyển lượt có lý do, lễ tân không được", async () => {
    const k = await taoBe();
    const a = (await banVe(k.id)).the;
    const b = (await banVe(k.id)).the;
    await expect(dieuChinhThe({ theVeId: a.id, loai: "CONG_LUOT", soLuong: 2, lyDo: "Bù lượt", user: S.ltLT })).rejects.toThrow();
    await expect(dieuChinhThe({ theVeId: a.id, loai: "CONG_LUOT", soLuong: 2, lyDo: "", user: S.qlLT })).rejects.toThrow(/lý do/);
    await dieuChinhThe({ theVeId: a.id, loai: "CONG_LUOT", soLuong: 2, lyDo: "Bù lượt hồ bảo trì", user: S.qlLT });
    expect((await theCua(a.id)).soLuotConLai).toBe(12);
    await dieuChinhThe({ theVeId: a.id, loai: "CHUYEN_LUOT", soLuong: 5, theDichId: b.id, lyDo: "Khách yêu cầu", user: S.qlLT });
    expect((await theCua(a.id)).soLuotConLai).toBe(7);
    expect((await theCua(b.id)).soLuotConLai).toBe(15);
    await expect(dieuChinhThe({ theVeId: a.id, loai: "TRU_LUOT", soLuong: 1, lyDo: "Sai", user: S.qlCG })).rejects.toThrow(/cơ sở khác/);
  });

  it("TC-15 (dịch vụ): quản lý cơ sở 2 không thao tác được dữ liệu cơ sở 1", async () => {
    const k = await taoBe();
    const { don } = await banVe(k.id, { thu: null });
    await expect(ghiNhanThu({ donHangId: don.id, loai: "THANH_TOAN", thu: { soTien: 1000, hinhThuc: "TIEN_MAT" }, user: S.qlCG })).rejects.toThrow(/cơ sở khác/);
    await expect(duyetKhach(k.id, S.qlCG)).rejects.toThrow(/cơ sở khác/);
  });

  it("FR-KH-04: gộp hồ sơ giữ toàn bộ thẻ, lượt, phiếu thu", async () => {
    const a = await taoBe("Nguyễn Minh Anh");
    const b = await taoBe("Nguyen Minh Anh", undefined, "0987654321");
    const tb = (await banVe(b.id)).the;
    await gopHoSo(a.id, b.id, S.qlLT);
    expect((await theCua(tb.id)).khachHangId).toBe(a.id);
    const [bb] = await db.select().from(khachHang).where(eq(khachHang.id, b.id));
    expect(bb.trangThai).toBe("NGUNG");
    expect(bb.gopVaoId).toBe(a.id);
  });
});
