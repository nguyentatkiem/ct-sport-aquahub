// Điều chỉnh thẻ (BR-16), bảo lưu (BR-26), tốt nghiệp (BR-27). Mọi thay đổi có lý do và vào nhật ký.
import { eq } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { dieuChinh, ghiDanh, khachHang, theVe } from "@/db/schema";
import { congNgay, ngayHopLe, ngayVN, soNgayGiua } from "@/lib/time";
import { co } from "@/lib/permissions";
import { ghiNhatKy } from "./audit";
import { LoiNghiepVu } from "./sales";
import type { NguoiDungPhien } from "./auth";

export type LoaiDieuChinh = "CONG_LUOT" | "TRU_LUOT" | "CHUYEN_LUOT" | "GIA_HAN_NGAY" | "MO_KHOA" | "HUY_THE";

async function layTheKhoa(tx: Tx, id: number, user: NguoiDungPhien) {
  const [t] = await tx.select().from(theVe).where(eq(theVe.id, id)).for("update");
  if (!t) throw new LoiNghiepVu("Không tìm thấy thẻ");
  const [k] = await tx.select({ coSoId: khachHang.coSoId }).from(khachHang).where(eq(khachHang.id, t.khachHangId));
  if (user.vaiTro !== "CHU" && user.coSoId !== k.coSoId && user.coSoId !== t.coSoBanId) throw new LoiNghiepVu("Thẻ thuộc cơ sở khác");
  return t;
}

const anh = (t: typeof theVe.$inferSelect) => ({
  soLuotConLai: t.soLuotConLai,
  ngayHetHan: t.ngayHetHan,
  trangThai: t.trangThai,
  baoLuuTu: t.baoLuuTu,
  baoLuuDen: t.baoLuuDen,
});

export async function dieuChinhThe(p: {
  theVeId: number;
  loai: LoaiDieuChinh;
  soLuong?: number | null;
  theDichId?: number | null;
  lyDo: string;
  user: NguoiDungPhien;
  now?: Date;
}) {
  if (!co(p.user.vaiTro, "DIEU_CHINH_THE")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được điều chỉnh thẻ");
  const lyDo = p.lyDo.trim();
  if (lyDo.length < 3) throw new LoiNghiepVu("Bắt buộc ghi lý do điều chỉnh");
  const homNay = ngayVN(p.now ?? new Date());
  const n = Math.trunc(Number(p.soLuong ?? 0));
  return db.transaction(async (tx) => {
    const t = await layTheKhoa(tx, p.theVeId, p.user);
    const cu = anh(t);
    let moi: Partial<typeof theVe.$inferInsert> = {};
    let dich: typeof theVe.$inferSelect | null = null;
    switch (p.loai) {
      case "CONG_LUOT":
      case "TRU_LUOT": {
        if (t.soLuotConLai == null) throw new LoiNghiepVu("Thẻ không giới hạn lượt");
        if (!(n > 0)) throw new LoiNghiepVu("Số lượt phải lớn hơn 0");
        moi = { soLuotConLai: t.soLuotConLai + (p.loai === "CONG_LUOT" ? n : -n) };
        break;
      }
      case "CHUYEN_LUOT": {
        if (t.soLuotConLai == null) throw new LoiNghiepVu("Thẻ không giới hạn lượt");
        if (!(n > 0) || n > t.soLuotConLai) throw new LoiNghiepVu("Số lượt chuyển không hợp lệ");
        if (!p.theDichId || p.theDichId === t.id) throw new LoiNghiepVu("Chọn thẻ nhận lượt");
        dich = await layTheKhoa(tx, p.theDichId, p.user);
        if (dich.khachHangId !== t.khachHangId) throw new LoiNghiepVu("Chỉ chuyển lượt giữa các thẻ của cùng khách");
        if (dich.soLuotConLai == null) throw new LoiNghiepVu("Thẻ nhận không giới hạn lượt");
        moi = { soLuotConLai: t.soLuotConLai - n };
        await tx.update(theVe).set({ soLuotConLai: dich.soLuotConLai + n }).where(eq(theVe.id, dich.id));
        break;
      }
      case "GIA_HAN_NGAY": {
        if (!(n > 0)) throw new LoiNghiepVu("Số ngày phải lớn hơn 0");
        if (!t.ngayHetHan) {
          if (t.hanDungNgay == null) throw new LoiNghiepVu("Thẻ không có hạn dùng");
          moi = { hanDungNgay: t.hanDungNgay + n };
        } else {
          moi = { ngayHetHan: congNgay(t.ngayHetHan, n) };
        }
        break;
      }
      case "MO_KHOA": {
        // Khôi phục thẻ đã huỷ, hoặc kết thúc bảo lưu sớm (trả lại số ngày chưa dùng)
        if (t.trangThai === "HUY") moi = { trangThai: "HOAT_DONG" };
        else if (t.baoLuuTu && t.baoLuuDen && t.baoLuuDen >= homNay) {
          const tu = t.baoLuuTu > homNay ? t.baoLuuTu : homNay;
          const traLai = soNgayGiua(tu, t.baoLuuDen) + 1;
          moi = {
            baoLuuDen: congNgay(homNay, -1) < t.baoLuuTu ? null : congNgay(homNay, -1),
            baoLuuTu: congNgay(homNay, -1) < t.baoLuuTu ? null : t.baoLuuTu,
            soNgayDaBaoLuu: Math.max(0, t.soNgayDaBaoLuu - traLai),
            ngayHetHan: t.ngayHetHan ? congNgay(t.ngayHetHan, -traLai) : null,
          };
        } else throw new LoiNghiepVu("Thẻ không ở trạng thái khoá");
        break;
      }
      case "HUY_THE":
        if (t.trangThai === "HUY") throw new LoiNghiepVu("Thẻ đã huỷ");
        moi = { trangThai: "HUY" };
        break;
      default:
        throw new LoiNghiepVu("Loại điều chỉnh không hợp lệ");
    }
    await tx.update(theVe).set(moi).where(eq(theVe.id, t.id));
    const [sau] = await tx.select().from(theVe).where(eq(theVe.id, t.id));
    await tx.insert(dieuChinh).values({
      theVeId: t.id,
      loai: p.loai,
      soLuong: n || null,
      theDichId: dich?.id ?? null,
      giaTriCu: cu,
      giaTriMoi: anh(sau),
      lyDo,
      nguoiThucHienId: p.user.id,
    });
    await ghiNhatKy(tx, p.user, {
      module: "Thẻ vé",
      hanhDong: "DIEU_CHINH_" + p.loai,
      doiTuong: t.maThe + (dich ? " → " + dich.maThe : ""),
      giaTriCu: cu,
      giaTriMoi: anh(sau),
      lyDo,
      coSoId: t.coSoBanId,
    });
    return sau;
  });
}

/** BR-26: bảo lưu thẻ trong khoảng [tu, den]; hạn dùng dời thêm đúng số ngày bảo lưu. */
export async function baoLuuThe(p: { theVeId: number; tu: string; den: string; lyDo: string; user: NguoiDungPhien; now?: Date }) {
  if (!co(p.user.vaiTro, "DIEU_CHINH_THE")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được bảo lưu");
  if (!p.lyDo.trim()) throw new LoiNghiepVu("Bắt buộc ghi lý do bảo lưu");
  const homNay = ngayVN(p.now ?? new Date());
  if (!ngayHopLe(p.tu) || !ngayHopLe(p.den)) throw new LoiNghiepVu("Ngày bảo lưu không hợp lệ");
  if (p.tu < homNay) throw new LoiNghiepVu("Ngày bắt đầu bảo lưu không được trước hôm nay");
  if (p.den < p.tu) throw new LoiNghiepVu("Ngày kết thúc phải sau ngày bắt đầu");
  const soNgay = soNgayGiua(p.tu, p.den) + 1;
  return db.transaction(async (tx) => {
    const t = await layTheKhoa(tx, p.theVeId, p.user);
    if (!t.choBaoLuu) throw new LoiNghiepVu("Sản phẩm của thẻ này không cho phép bảo lưu");
    if (t.trangThai === "HUY") throw new LoiNghiepVu("Thẻ đã huỷ");
    if (t.baoLuuDen && t.baoLuuDen >= homNay) throw new LoiNghiepVu("Thẻ đang có một kỳ bảo lưu chưa kết thúc");
    const toiDa = t.baoLuuToiDaNgay ?? 0;
    if (t.soNgayDaBaoLuu + soNgay > toiDa) throw new LoiNghiepVu(`Vượt số ngày bảo lưu tối đa (${toiDa} ngày, đã dùng ${t.soNgayDaBaoLuu})`);
    const cu = anh(t);
    await tx
      .update(theVe)
      .set({
        baoLuuTu: p.tu,
        baoLuuDen: p.den,
        soNgayDaBaoLuu: t.soNgayDaBaoLuu + soNgay,
        ngayHetHan: t.ngayHetHan ? congNgay(t.ngayHetHan, soNgay) : null,
      })
      .where(eq(theVe.id, t.id));
    const [sau] = await tx.select().from(theVe).where(eq(theVe.id, t.id));
    await tx.insert(dieuChinh).values({ theVeId: t.id, loai: "BAO_LUU", soLuong: soNgay, giaTriCu: cu, giaTriMoi: anh(sau), lyDo: p.lyDo.trim(), nguoiThucHienId: p.user.id });
    await ghiNhatKy(tx, p.user, { module: "Thẻ vé", hanhDong: "BAO_LUU", doiTuong: t.maThe, giaTriCu: cu, giaTriMoi: anh(sau), lyDo: p.lyDo, coSoId: t.coSoBanId });
    return sau;
  });
}

/** Bảo lưu ghi danh khoá học: trong thời gian này không cộng buổi. */
export async function baoLuuGhiDanh(p: { ghiDanhId: number; tu: string; den: string; lyDo: string; user: NguoiDungPhien; now?: Date }) {
  if (!co(p.user.vaiTro, "DIEU_CHINH_THE")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được bảo lưu");
  if (!p.lyDo.trim()) throw new LoiNghiepVu("Bắt buộc ghi lý do bảo lưu");
  const homNay = ngayVN(p.now ?? new Date());
  if (!ngayHopLe(p.tu) || !ngayHopLe(p.den) || p.tu < homNay || p.den < p.tu) throw new LoiNghiepVu("Khoảng ngày bảo lưu không hợp lệ");
  const soNgay = soNgayGiua(p.tu, p.den) + 1;
  return db.transaction(async (tx) => {
    const [g] = await tx.select().from(ghiDanh).where(eq(ghiDanh.id, p.ghiDanhId)).for("update");
    if (!g) throw new LoiNghiepVu("Không tìm thấy ghi danh");
    if (p.user.vaiTro !== "CHU" && p.user.coSoId !== g.coSoId) throw new LoiNghiepVu("Ghi danh thuộc cơ sở khác");
    if (!g.choBaoLuu) throw new LoiNghiepVu("Khoá học này không cho phép bảo lưu");
    if (soNgay > (g.baoLuuToiDaNgay ?? 0)) throw new LoiNghiepVu(`Vượt số ngày bảo lưu tối đa (${g.baoLuuToiDaNgay ?? 0} ngày)`);
    await tx.update(ghiDanh).set({ baoLuuTu: p.tu, baoLuuDen: p.den }).where(eq(ghiDanh.id, g.id));
    await tx.insert(dieuChinh).values({ ghiDanhId: g.id, loai: "BAO_LUU", soLuong: soNgay, giaTriCu: { baoLuuTu: g.baoLuuTu, baoLuuDen: g.baoLuuDen }, giaTriMoi: { baoLuuTu: p.tu, baoLuuDen: p.den }, lyDo: p.lyDo.trim(), nguoiThucHienId: p.user.id });
    await ghiNhatKy(tx, p.user, { module: "Khoá học", hanhDong: "BAO_LUU_GHI_DANH", doiTuong: `GD${g.id}`, giaTriMoi: { tu: p.tu, den: p.den }, lyDo: p.lyDo, coSoId: g.coSoId });
  });
}

/** BR-27: quản lý xác nhận tốt nghiệp khi đã đủ điều kiện. */
export async function xacNhanTotNghiep(p: { ghiDanhId: number; user: NguoiDungPhien }) {
  if (!co(p.user.vaiTro, "XAC_NHAN_TOT_NGHIEP")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được xác nhận tốt nghiệp");
  return db.transaction(async (tx) => {
    const [g] = await tx.select().from(ghiDanh).where(eq(ghiDanh.id, p.ghiDanhId)).for("update");
    if (!g) throw new LoiNghiepVu("Không tìm thấy ghi danh");
    if (p.user.vaiTro !== "CHU" && p.user.coSoId !== g.coSoId) throw new LoiNghiepVu("Ghi danh thuộc cơ sở khác");
    if (g.trangThai !== "DU_DIEU_KIEN_TOT_NGHIEP") throw new LoiNghiepVu("Học viên chưa đủ số buổi tốt nghiệp");
    await tx.update(ghiDanh).set({ trangThai: "TOT_NGHIEP" }).where(eq(ghiDanh.id, g.id));
    await tx.insert(dieuChinh).values({ ghiDanhId: g.id, loai: "TOT_NGHIEP", giaTriCu: { trangThai: g.trangThai }, giaTriMoi: { trangThai: "TOT_NGHIEP" }, lyDo: "Xác nhận tốt nghiệp", nguoiThucHienId: p.user.id });
    await ghiNhatKy(tx, p.user, { module: "Khoá học", hanhDong: "TOT_NGHIEP", doiTuong: `GD${g.id}`, coSoId: g.coSoId });
  });
}
