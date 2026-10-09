// Bán thẻ vé, ghi danh khoá học, thu tiền, cọc, hoàn tiền (L3, L4, BR-16 → BR-22).
import { and, eq, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { coSo, donHang, ghiDanh, khachHang, lopHoc, phieuThu, sanPham, theVe } from "@/db/schema";
import { hetHanKhiBan } from "@/lib/checkin-engine";
import { ngayHopLe, ngayVN } from "@/lib/time";
import { co } from "@/lib/permissions";
import { sinhMaDon, sinhMaPhieu, sinhMaThe } from "./codes";
import { ghiNhatKy } from "./audit";
import type { NguoiDungPhien } from "./auth";

export class LoiNghiepVu extends Error {}

export type ThongTinThu = {
  soTien: number; // số tiền thu lần này (0 = chưa thu)
  hinhThuc: "TIEN_MAT" | "CHUYEN_KHOAN";
  ghiChu?: string | null;
};

type SanPhamRow = typeof sanPham.$inferSelect;

function kiemTraSanPhamBan(sp: SanPhamRow | undefined, loai: "THE_VE" | "KHOA_HOC", coSoId: number) {
  if (!sp) throw new LoiNghiepVu("Không tìm thấy sản phẩm");
  if (sp.loai !== loai) throw new LoiNghiepVu("Sai loại sản phẩm");
  if (sp.trangThai !== "DANG_BAN" && !sp.laTheChuyenDoi) throw new LoiNghiepVu("Sản phẩm đã ngừng bán");
  if (sp.coSoApDung && sp.coSoApDung.length && !sp.coSoApDung.includes(coSoId)) throw new LoiNghiepVu("Sản phẩm không bán tại cơ sở này");
}

function kiemTraGia(giaNiemYet: number, giaThucThu: number, lyDoGiam?: string | null) {
  if (!Number.isFinite(giaThucThu) || giaThucThu < 0) throw new LoiNghiepVu("Giá thực thu không hợp lệ");
  // BR-17: thấp hơn niêm yết thì bắt buộc lý do
  if (giaThucThu < giaNiemYet && !(lyDoGiam ?? "").trim()) throw new LoiNghiepVu("Giá thực thu thấp hơn niêm yết: bắt buộc ghi lý do giảm");
}

/** Tính lại đã thu, còn nợ, trạng thái thanh toán của đơn (BR-18). */
export async function tinhLaiDon(tx: Tx, donHangId: number) {
  const [d] = await tx.select().from(donHang).where(eq(donHang.id, donHangId)).for("update");
  const [s] = await tx
    .select({
      thu: sql<number>`coalesce(sum(case when ${phieuThu.loai} <> 'HOAN_TIEN' then ${phieuThu.soTien} else 0 end),0)::bigint`,
      hoan: sql<number>`coalesce(sum(case when ${phieuThu.loai} = 'HOAN_TIEN' then ${phieuThu.soTien} else 0 end),0)::bigint`,
    })
    .from(phieuThu)
    .where(and(eq(phieuThu.donHangId, donHangId), eq(phieuThu.trangThai, "HIEU_LUC")));
  const thu = Number(s.thu);
  const hoan = Number(s.hoan);
  const daThu = thu - hoan;
  const conNo = Math.max(d.giaThucThu - daThu, 0);
  let trangThaiTt: string;
  if (hoan > 0 && daThu <= 0) trangThaiTt = "DA_HOAN";
  else if (daThu <= 0) trangThaiTt = d.giaThucThu === 0 ? "DA_THU_DU" : "CHUA_THU";
  else if (daThu < d.giaThucThu) trangThaiTt = "DA_COC";
  else trangThaiTt = "DA_THU_DU";
  await tx.update(donHang).set({ daThu, conNo, trangThaiTt }).where(eq(donHang.id, donHangId));
  return { daThu, conNo, trangThaiTt };
}

async function taoDon(
  tx: Tx,
  p: {
    khachHangId: number;
    coSoId: number;
    sp: SanPhamRow;
    giaThucThu: number;
    lyDoGiam?: string | null;
    khongTinhDoanhSo?: boolean;
    user: NguoiDungPhien | null;
    ngay: string;
  },
) {
  const maDon = await sinhMaDon(tx, p.ngay);
  const [d] = await tx
    .insert(donHang)
    .values({
      maDon,
      khachHangId: p.khachHangId,
      coSoId: p.coSoId,
      loai: p.sp.loai,
      sanPhamId: p.sp.id,
      tenSanPham: p.sp.ten,
      giaNiemYet: p.sp.giaNiemYet,
      giaThucThu: p.giaThucThu,
      lyDoGiam: p.giaThucThu < p.sp.giaNiemYet ? (p.lyDoGiam ?? "").trim() : null,
      daThu: 0,
      conNo: p.giaThucThu,
      trangThaiTt: p.giaThucThu === 0 ? "DA_THU_DU" : "CHUA_THU",
      khongTinhDoanhSo: !!p.khongTinhDoanhSo,
      ngayBan: p.ngay,
      nguoiTaoId: p.user?.id ?? null,
    })
    .returning();
  return d;
}

async function taoPhieu(
  tx: Tx,
  p: { don: typeof donHang.$inferSelect; loai: "COC" | "THANH_TOAN" | "HOAN_TIEN"; thu: ThongTinThu; user: NguoiDungPhien | null; now: Date },
) {
  const ngay = ngayVN(p.now);
  const maPhieu = await sinhMaPhieu(tx, ngay);
  const [ph] = await tx
    .insert(phieuThu)
    .values({
      maPhieu,
      donHangId: p.don.id,
      khachHangId: p.don.khachHangId,
      coSoId: p.don.coSoId,
      loai: p.loai,
      soTien: p.thu.soTien,
      hinhThuc: p.thu.hinhThuc,
      thoiGian: p.now,
      ngayVn: ngay,
      nguoiThuId: p.user?.id ?? null,
      ghiChu: p.thu.ghiChu ?? null,
    })
    .returning();
  return ph;
}

async function khachHoatDong(tx: Tx, khachHangId: number, coSoId: number) {
  const [k] = await tx.select().from(khachHang).where(eq(khachHang.id, khachHangId)).for("update");
  if (!k) throw new LoiNghiepVu("Không tìm thấy khách");
  if (k.trangThai === "CHO_DUYET") throw new LoiNghiepVu("Hồ sơ đang chờ duyệt: duyệt trước khi bán");
  if (k.trangThai !== "HOAT_DONG") throw new LoiNghiepVu("Hồ sơ đã ngừng hoạt động");
  const [cs] = await tx.select().from(coSo).where(eq(coSo.id, coSoId));
  if (!cs) throw new LoiNghiepVu("Không tìm thấy cơ sở");
  return k;
}

async function taoTheTuSanPham(
  tx: Tx,
  p: {
    khachHangId: number;
    coSoId: number;
    sp: SanPhamRow;
    donHangId: number | null;
    ngay: string;
    soLuotChuyenDoi?: number | null;
    ngayHetHanChuyenDoi?: string | null;
    anhTheGiay?: string | null;
  },
) {
  const maThe = await sinhMaThe(tx, p.ngay);
  const laChuyenDoi = !!p.sp.laTheChuyenDoi;
  const soLuot = laChuyenDoi ? p.soLuotChuyenDoi ?? null : p.sp.soLuot;
  const ngayHetHan = laChuyenDoi ? p.ngayHetHanChuyenDoi ?? null : hetHanKhiBan(p.ngay, p.sp.hanDungNgay, p.sp.mocTinhHan);
  // Chụp toàn bộ luật từ sản phẩm (BR-22)
  const [t] = await tx
    .insert(theVe)
    .values({
      maThe,
      khachHangId: p.khachHangId,
      sanPhamId: p.sp.id,
      donHangId: p.donHangId,
      coSoBanId: p.coSoId,
      tenSanPham: p.sp.ten,
      tenSanPhamEn: p.sp.tenEn,
      soLuotGoc: soLuot,
      soLuotConLai: soLuot,
      hanDungNgay: laChuyenDoi ? null : p.sp.hanDungNgay,
      mocTinhHan: laChuyenDoi ? "NGAY_MUA" : p.sp.mocTinhHan,
      luatChan: p.sp.luatChan,
      hanhDongKhiViPham: p.sp.hanhDongKhiViPham,
      dungLienCoSo: p.sp.dungLienCoSo,
      coSoApDung: p.sp.coSoApDung,
      toiDaLuotMoiNgay: p.sp.toiDaLuotMoiNgay,
      nguongCanhBaoLuot: p.sp.nguongCanhBaoLuot,
      nguongCanhBaoNgay: p.sp.nguongCanhBaoNgay,
      choBaoLuu: p.sp.choBaoLuu,
      baoLuuToiDaNgay: p.sp.baoLuuToiDaNgay,
      laChuyenDoi,
      ngayMua: p.ngay,
      ngayKichHoat: p.sp.mocTinhHan === "NGAY_MUA" || laChuyenDoi ? p.ngay : null,
      ngayHetHan,
      anhTheGiay: p.anhTheGiay ?? null,
    })
    .returning();
  return t;
}

/** Thu tiền kèm khi bán: thu ít hơn giá là cọc, đủ là thanh toán. */
async function thuKhiBan(tx: Tx, don: typeof donHang.$inferSelect, thu: ThongTinThu | null | undefined, user: NguoiDungPhien | null, now: Date) {
  if (!thu || !thu.soTien) return null;
  if (thu.soTien < 0) throw new LoiNghiepVu("Số tiền thu không hợp lệ");
  if (thu.soTien > don.giaThucThu) throw new LoiNghiepVu("Số tiền thu lớn hơn giá thực thu");
  const ph = await taoPhieu(tx, { don, loai: thu.soTien < don.giaThucThu ? "COC" : "THANH_TOAN", thu, user, now });
  await tinhLaiDon(tx, don.id);
  return ph;
}

export async function banTheVe(p: {
  khachHangId: number;
  sanPhamId: number;
  coSoId: number;
  giaThucThu: number;
  lyDoGiam?: string | null;
  thu?: ThongTinThu | null;
  user: NguoiDungPhien | null;
  now?: Date;
  // Thẻ chuyển đổi từ thẻ giấy (mục 11.2)
  soLuotChuyenDoi?: number | null;
  ngayHetHanChuyenDoi?: string | null;
  anhTheGiay?: string | null;
}) {
  const now = p.now ?? new Date();
  const ngay = ngayVN(now);
  if (p.ngayHetHanChuyenDoi && !ngayHopLe(p.ngayHetHanChuyenDoi)) throw new LoiNghiepVu("Hạn thẻ giấy không hợp lệ");
  return db.transaction(async (tx) => {
    await khachHoatDong(tx, p.khachHangId, p.coSoId);
    const [sp] = await tx.select().from(sanPham).where(eq(sanPham.id, p.sanPhamId));
    kiemTraSanPhamBan(sp, "THE_VE", p.coSoId);
    if (sp.laTheChuyenDoi && !(Number.isInteger(p.soLuotChuyenDoi) && (p.soLuotChuyenDoi as number) >= 0)) throw new LoiNghiepVu("Nhập số lượt còn lại trên thẻ giấy");
    const gia = sp.laTheChuyenDoi ? 0 : p.giaThucThu;
    kiemTraGia(sp.giaNiemYet, gia, p.lyDoGiam);
    const don = await taoDon(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp, giaThucThu: gia, lyDoGiam: p.lyDoGiam, khongTinhDoanhSo: sp.laTheChuyenDoi, user: p.user, ngay });
    const the = await taoTheTuSanPham(tx, {
      khachHangId: p.khachHangId,
      coSoId: p.coSoId,
      sp,
      donHangId: don.id,
      ngay,
      soLuotChuyenDoi: p.soLuotChuyenDoi,
      ngayHetHanChuyenDoi: p.ngayHetHanChuyenDoi,
      anhTheGiay: p.anhTheGiay,
    });
    const phieu = await thuKhiBan(tx, don, p.thu, p.user, now);
    await ghiNhatKy(tx, p.user, {
      module: "Bán hàng",
      hanhDong: sp.laTheChuyenDoi ? "TAO_THE_CHUYEN_DOI" : "BAN_THE_VE",
      doiTuong: the.maThe,
      giaTriMoi: { maDon: don.maDon, gia, lyDoGiam: p.lyDoGiam ?? null, thu: p.thu?.soTien ?? 0 },
      coSoId: p.coSoId,
    });
    return { don, the, phieu };
  });
}

export async function ghiDanhKhoaHoc(p: {
  khachHangId: number;
  sanPhamId: number;
  lopHocId: number;
  giaoVienId?: number | null;
  coSoId: number;
  giaThucThu: number;
  lyDoGiam?: string | null;
  thu?: ThongTinThu | null;
  ghiChu?: string | null;
  // Bán kèm thẻ vé trong cùng thao tác (FR-BH-02)
  banKem?: { sanPhamId: number; giaThucThu: number; lyDoGiam?: string | null; thu?: ThongTinThu | null } | null;
  user: NguoiDungPhien | null;
  now?: Date;
}) {
  const now = p.now ?? new Date();
  const ngay = ngayVN(now);
  return db.transaction(async (tx) => {
    await khachHoatDong(tx, p.khachHangId, p.coSoId);
    const [sp] = await tx.select().from(sanPham).where(eq(sanPham.id, p.sanPhamId));
    kiemTraSanPhamBan(sp, "KHOA_HOC", p.coSoId);
    kiemTraGia(sp.giaNiemYet, p.giaThucThu, p.lyDoGiam);
    const [lop] = await tx.select().from(lopHoc).where(eq(lopHoc.id, p.lopHocId));
    if (!lop || lop.coSoId !== p.coSoId) throw new LoiNghiepVu("Lớp không thuộc cơ sở này");
    if (lop.trangThai !== "DANG_HOC") throw new LoiNghiepVu("Lớp đã kết thúc");
    if (lop.sanPhamId !== sp.id) throw new LoiNghiepVu("Lớp không thuộc khoá học đã chọn");
    const don = await taoDon(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp, giaThucThu: p.giaThucThu, lyDoGiam: p.lyDoGiam, user: p.user, ngay });
    const [gd] = await tx
      .insert(ghiDanh)
      .values({
        khachHangId: p.khachHangId,
        sanPhamId: sp.id,
        donHangId: don.id,
        lopHocId: lop.id,
        giaoVienId: p.giaoVienId ?? lop.giaoVienId,
        coSoId: p.coSoId,
        tenKhoaHoc: sp.ten,
        ngayGhiDanh: ngay,
        soBuoiHocGoc: sp.soBuoiHoc,
        soBuoiTotNghiep: sp.soBuoiTotNghiep ?? sp.soBuoiHoc,
        choBaoLuu: sp.choBaoLuu,
        baoLuuToiDaNgay: sp.baoLuuToiDaNgay,
        ghiChu: p.ghiChu ?? null,
      })
      .returning();
    const phieu = await thuKhiBan(tx, don, p.thu, p.user, now);
    let kem: { don: typeof donHang.$inferSelect; the: typeof theVe.$inferSelect } | null = null;
    if (p.banKem) {
      const [spT] = await tx.select().from(sanPham).where(eq(sanPham.id, p.banKem.sanPhamId));
      kiemTraSanPhamBan(spT, "THE_VE", p.coSoId);
      kiemTraGia(spT.giaNiemYet, p.banKem.giaThucThu, p.banKem.lyDoGiam);
      const donT = await taoDon(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp: spT, giaThucThu: p.banKem.giaThucThu, lyDoGiam: p.banKem.lyDoGiam, user: p.user, ngay });
      const the = await taoTheTuSanPham(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp: spT, donHangId: donT.id, ngay });
      await thuKhiBan(tx, donT, p.banKem.thu, p.user, now);
      kem = { don: donT, the };
    }
    await ghiNhatKy(tx, p.user, {
      module: "Bán hàng",
      hanhDong: "GHI_DANH",
      doiTuong: don.maDon,
      giaTriMoi: { khoaHoc: sp.ten, lop: lop.ten, gia: p.giaThucThu, banKem: kem?.the.maThe ?? null },
      coSoId: p.coSoId,
    });
    return { don, ghiDanh: gd, phieu, kem };
  });
}

/** Ghi nhận thu tiền, cọc hoặc hoàn tiền cho 1 đơn (FR-BH-04). */
export async function ghiNhanThu(p: {
  donHangId: number;
  loai: "COC" | "THANH_TOAN" | "HOAN_TIEN";
  thu: ThongTinThu;
  user: NguoiDungPhien;
  now?: Date;
}) {
  const now = p.now ?? new Date();
  if (!(p.thu.soTien > 0)) throw new LoiNghiepVu("Số tiền phải lớn hơn 0");
  if (p.loai === "HOAN_TIEN" && !co(p.user.vaiTro, "HUY_PHIEU")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được hoàn tiền");
  return db.transaction(async (tx) => {
    const [don] = await tx.select().from(donHang).where(eq(donHang.id, p.donHangId)).for("update");
    if (!don) throw new LoiNghiepVu("Không tìm thấy đơn");
    if (p.user.vaiTro !== "CHU" && p.user.coSoId !== don.coSoId) throw new LoiNghiepVu("Đơn thuộc cơ sở khác");
    if (p.loai === "HOAN_TIEN") {
      if (!(p.thu.ghiChu ?? "").trim()) throw new LoiNghiepVu("Hoàn tiền bắt buộc ghi lý do");
      if (p.thu.soTien > don.daThu) throw new LoiNghiepVu("Số tiền hoàn lớn hơn số đã thu");
    } else if (p.thu.soTien > don.conNo) {
      throw new LoiNghiepVu("Số tiền thu lớn hơn số còn nợ");
    }
    const ph = await taoPhieu(tx, { don, loai: p.loai, thu: p.thu, user: p.user, now });
    const kq = await tinhLaiDon(tx, don.id);
    await ghiNhatKy(tx, p.user, {
      module: "Thu tiền",
      hanhDong: p.loai === "HOAN_TIEN" ? "HOAN_TIEN" : "THU_TIEN",
      doiTuong: ph.maPhieu,
      giaTriCu: { daThu: don.daThu, conNo: don.conNo },
      giaTriMoi: kq,
      lyDo: p.thu.ghiChu ?? null,
      coSoId: don.coSoId,
    });
    return { phieu: ph, ...kq };
  });
}

/** BR-20: phiếu thu không xoá, chỉ huỷ có lý do. */
export async function huyPhieu(p: { phieuId: number; lyDo: string; user: NguoiDungPhien; now?: Date }) {
  if (!co(p.user.vaiTro, "HUY_PHIEU")) throw new LoiNghiepVu("Bạn không có quyền huỷ phiếu");
  if (!p.lyDo.trim()) throw new LoiNghiepVu("Bắt buộc ghi lý do huỷ");
  return db.transaction(async (tx) => {
    const [ph] = await tx.select().from(phieuThu).where(eq(phieuThu.id, p.phieuId)).for("update");
    if (!ph) throw new LoiNghiepVu("Không tìm thấy phiếu");
    if (ph.trangThai === "DA_HUY") throw new LoiNghiepVu("Phiếu đã huỷ");
    if (p.user.vaiTro !== "CHU" && p.user.coSoId !== ph.coSoId) throw new LoiNghiepVu("Phiếu thuộc cơ sở khác");
    await tx.update(phieuThu).set({ trangThai: "DA_HUY", lyDoHuy: p.lyDo.trim(), nguoiHuyId: p.user.id, huyLuc: p.now ?? new Date() }).where(eq(phieuThu.id, ph.id));
    const kq = await tinhLaiDon(tx, ph.donHangId);
    await ghiNhatKy(tx, p.user, {
      module: "Thu tiền",
      hanhDong: "HUY_PHIEU",
      doiTuong: ph.maPhieu,
      giaTriCu: { soTien: ph.soTien, trangThai: "HIEU_LUC" },
      giaTriMoi: { trangThai: "DA_HUY", ...kq },
      lyDo: p.lyDo,
      coSoId: ph.coSoId,
    });
    return kq;
  });
}

/** Sửa giá thực thu sau khi lưu (Chủ, Quản lý; bắt buộc lý do). */
export async function suaGiaThucThu(p: { donHangId: number; giaMoi: number; lyDo: string; user: NguoiDungPhien }) {
  if (!co(p.user.vaiTro, "HUY_PHIEU")) throw new LoiNghiepVu("Bạn không có quyền sửa giá sau khi lưu");
  if (!p.lyDo.trim()) throw new LoiNghiepVu("Bắt buộc ghi lý do");
  return db.transaction(async (tx) => {
    const [don] = await tx.select().from(donHang).where(eq(donHang.id, p.donHangId)).for("update");
    if (!don) throw new LoiNghiepVu("Không tìm thấy đơn");
    if (p.user.vaiTro !== "CHU" && p.user.coSoId !== don.coSoId) throw new LoiNghiepVu("Đơn thuộc cơ sở khác");
    if (!(p.giaMoi >= 0)) throw new LoiNghiepVu("Giá không hợp lệ");
    await tx
      .update(donHang)
      .set({ giaThucThu: p.giaMoi, lyDoGiam: p.giaMoi < don.giaNiemYet ? p.lyDo.trim() : don.lyDoGiam })
      .where(eq(donHang.id, don.id));
    const kq = await tinhLaiDon(tx, don.id);
    await ghiNhatKy(tx, p.user, {
      module: "Bán hàng",
      hanhDong: "SUA_GIA_THUC_THU",
      doiTuong: don.maDon,
      giaTriCu: { giaThucThu: don.giaThucThu },
      giaTriMoi: { giaThucThu: p.giaMoi, ...kq },
      lyDo: p.lyDo,
      coSoId: don.coSoId,
    });
    return kq;
  });
}

/** Dùng cho nhập Excel (FR-HT-06): tạo thẻ chuyển đổi trong giao dịch có sẵn. */
export async function taoTheChuyenDoiTx(
  tx: Tx,
  p: { khachHangId: number; coSoId: number; sanPhamId: number; soLuot: number | null; ngayHetHan: string | null; user: NguoiDungPhien | null; ngay: string },
) {
  const [sp] = await tx.select().from(sanPham).where(eq(sanPham.id, p.sanPhamId));
  if (!sp || !sp.laTheChuyenDoi) throw new LoiNghiepVu("Chưa có sản phẩm Thẻ chuyển đổi");
  const don = await taoDon(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp, giaThucThu: 0, khongTinhDoanhSo: true, user: p.user, ngay: p.ngay });
  return taoTheTuSanPham(tx, { khachHangId: p.khachHangId, coSoId: p.coSoId, sp, donHangId: don.id, ngay: p.ngay, soLuotChuyenDoi: p.soLuot, ngayHetHanChuyenDoi: p.ngayHetHan });
}
