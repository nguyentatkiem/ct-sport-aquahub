// Hồ sơ khách và người liên hệ (FR-KH, BR-23 → BR-25, BR-29).
import { and, eq, ne, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { checkIn, coSo, donHang, ghiDanh, khachHang, nguoiLienHe, phieuThu, theVe, lienHeCanhBao } from "@/db/schema";
import { chuanSdt, chuoiTimKiem, khongDau, tokenNgauNhien } from "@/lib/text";
import { ngayHopLe, ngayVN, tinhTuoi } from "@/lib/time";
import { co } from "@/lib/permissions";
import { sinhMaKhach } from "./codes";
import { ghiNhatKy } from "./audit";
import { LoiNghiepVu } from "./sales";
import type { NguoiDungPhien } from "./auth";

export type DuLieuKhach = {
  hoTen: string;
  ngaySinh: string; // YYYY-MM-DD
  sdt?: string | null;
  lienHe?: { hoTen: string; sdt: string; quanHe: string } | null;
  coSoId: number;
  ghiChu?: string | null;
  ghiChuSucKhoe?: string | null;
  khoaHocMuonDangKyId?: number | null;
  dongYDuLieu?: boolean;
};

export function kiemTraDuLieuKhach(d: DuLieuKhach, homNay = ngayVN()) {
  if (!d.hoTen?.trim()) throw new LoiNghiepVu("Nhập họ tên");
  if (!ngayHopLe(d.ngaySinh)) throw new LoiNghiepVu("Ngày sinh không hợp lệ");
  if (d.ngaySinh > homNay) throw new LoiNghiepVu("Ngày sinh không hợp lệ");
  const tuoi = tinhTuoi(d.ngaySinh, homNay);
  const sdt = chuanSdt(d.sdt);
  if (sdt && (sdt.length < 9 || sdt.length > 11)) throw new LoiNghiepVu("SĐT không hợp lệ");
  if (tuoi >= 18 && !sdt) throw new LoiNghiepVu("Người lớn bắt buộc có SĐT");
  if (tuoi < 18) {
    if (!d.lienHe?.hoTen?.trim() || !chuanSdt(d.lienHe?.sdt)) throw new LoiNghiepVu("Dưới 18 tuổi bắt buộc có tên và SĐT phụ huynh/người liên hệ");
  }
  if (d.lienHe && chuanSdt(d.lienHe.sdt) && !["BO", "ME", "ONG", "BA", "KHAC"].includes(d.lienHe.quanHe)) throw new LoiNghiepVu("Chọn quan hệ");
  return { tuoi, sdt: sdt || null };
}

/** BR-24: trùng họ tên + ngày sinh + SĐT liên hệ (SĐT khách hoặc SĐT người liên hệ). */
export async function timKhachTrung(d: { hoTen: string; ngaySinh: string; sdt?: string | null; sdtLienHe?: string | null }, boQuaId?: number) {
  const ten = khongDau(d.hoTen);
  const sdts = [chuanSdt(d.sdt), chuanSdt(d.sdtLienHe)].filter(Boolean);
  if (!sdts.length) return [];
  const rows = await db
    .select({ id: khachHang.id, maKh: khachHang.maKh, hoTen: khachHang.hoTen, ngaySinh: khachHang.ngaySinh, sdt: khachHang.sdt, trangThai: khachHang.trangThai, sdtLienHe: nguoiLienHe.sdt })
    .from(khachHang)
    .leftJoin(nguoiLienHe, eq(nguoiLienHe.id, khachHang.nguoiLienHeId))
    .where(
      and(
        eq(khachHang.ngaySinh, d.ngaySinh),
        sql`${khachHang.gopVaoId} is null`,
        boQuaId ? ne(khachHang.id, boQuaId) : sql`true`,
        or(sql`${khachHang.sdt} in ${sdts}`, sql`${nguoiLienHe.sdt} in ${sdts}`),
      ),
    );
  return rows.filter((r) => khongDau(r.hoTen) === ten);
}

async function layHoacTaoLienHe(tx: Tx, lh: DuLieuKhach["lienHe"]) {
  if (!lh || !chuanSdt(lh.sdt)) return null;
  const sdt = chuanSdt(lh.sdt);
  // BR-25: 1 SĐT liên hệ có thể gắn nhiều khách — dùng lại người liên hệ cùng SĐT và tên
  const ds = await tx.select().from(nguoiLienHe).where(eq(nguoiLienHe.sdt, sdt));
  const trung = ds.find((x) => khongDau(x.hoTen) === khongDau(lh.hoTen));
  if (trung) return trung.id;
  const [m] = await tx.insert(nguoiLienHe).values({ hoTen: lh.hoTen.trim(), sdt, quanHe: lh.quanHe || "KHAC" }).returning();
  return m.id;
}

export async function taoKhach(
  d: DuLieuKhach,
  opts: { nguonTao: "NV_NHAP" | "KHACH_TU_DANG_KY" | "NHAP_EXCEL"; user: NguoiDungPhien | null; tx?: Tx },
) {
  const { sdt } = kiemTraDuLieuKhach(d);
  const run = async (tx: Tx) => {
    const [cs] = await tx.select().from(coSo).where(eq(coSo.id, d.coSoId));
    if (!cs) throw new LoiNghiepVu("Không tìm thấy cơ sở");
    if (opts.nguonTao === "KHACH_TU_DANG_KY" && !cs.choTuDangKy) throw new LoiNghiepVu("Cơ sở chưa mở đăng ký trực tuyến, mời gặp lễ tân");
    const nguoiLienHeId = await layHoacTaoLienHe(tx, d.lienHe);
    const maKh = await sinhMaKhach(tx, cs.ma);
    const [k] = await tx
      .insert(khachHang)
      .values({
        maKh,
        hoTen: d.hoTen.trim(),
        ngaySinh: d.ngaySinh,
        sdt,
        nguoiLienHeId,
        coSoId: cs.id,
        nguonTao: opts.nguonTao,
        trangThai: opts.nguonTao === "KHACH_TU_DANG_KY" ? "CHO_DUYET" : "HOAT_DONG",
        ghiChu: d.ghiChu?.trim() || null,
        ghiChuSucKhoe: d.ghiChuSucKhoe?.trim() || null,
        khoaHocMuonDangKyId: d.khoaHocMuonDangKyId ?? null,
        qrToken: tokenNgauNhien(),
        dongYDuLieuLuc: d.dongYDuLieu ? new Date() : null,
        timKiem: chuoiTimKiem(d.hoTen, maKh, sdt, d.lienHe?.hoTen, chuanSdt(d.lienHe?.sdt)),
      })
      .returning();
    await ghiNhatKy(tx, opts.user, {
      module: "Khách hàng",
      hanhDong: opts.nguonTao === "KHACH_TU_DANG_KY" ? "KHACH_TU_DANG_KY" : "TAO_KHACH",
      doiTuong: maKh,
      giaTriMoi: { hoTen: k.hoTen, ngaySinh: k.ngaySinh },
      coSoId: cs.id,
    });
    return k;
  };
  return opts.tx ? run(opts.tx) : db.transaction(run);
}

export async function capNhatKhach(id: number, d: DuLieuKhach, user: NguoiDungPhien) {
  const { sdt } = kiemTraDuLieuKhach(d);
  return db.transaction(async (tx) => {
    const [cu] = await tx.select().from(khachHang).where(eq(khachHang.id, id)).for("update");
    if (!cu) throw new LoiNghiepVu("Không tìm thấy khách");
    if (user.vaiTro !== "CHU" && user.coSoId !== cu.coSoId) throw new LoiNghiepVu("Khách thuộc cơ sở khác");
    if (user.vaiTro !== "CHU" && d.coSoId !== cu.coSoId) throw new LoiNghiepVu("Chỉ Chủ trung tâm được chuyển cơ sở");
    const nguoiLienHeId = await layHoacTaoLienHe(tx, d.lienHe);
    const moi = {
      hoTen: d.hoTen.trim(),
      ngaySinh: d.ngaySinh,
      sdt,
      nguoiLienHeId,
      coSoId: d.coSoId,
      ghiChu: d.ghiChu?.trim() || null,
      ghiChuSucKhoe: d.ghiChuSucKhoe?.trim() || null,
      timKiem: chuoiTimKiem(d.hoTen, cu.maKh, sdt, d.lienHe?.hoTen, chuanSdt(d.lienHe?.sdt)),
    };
    await tx.update(khachHang).set(moi).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, {
      module: "Khách hàng",
      hanhDong: "SUA_KHACH",
      doiTuong: cu.maKh,
      giaTriCu: { hoTen: cu.hoTen, ngaySinh: cu.ngaySinh, sdt: cu.sdt, coSoId: cu.coSoId, ghiChu: cu.ghiChu },
      giaTriMoi: { hoTen: moi.hoTen, ngaySinh: moi.ngaySinh, sdt: moi.sdt, coSoId: moi.coSoId, ghiChu: moi.ghiChu },
      coSoId: cu.coSoId,
    });
  });
}

async function layKhachKhoa(tx: Tx, id: number, user: NguoiDungPhien) {
  const [k] = await tx.select().from(khachHang).where(eq(khachHang.id, id)).for("update");
  if (!k) throw new LoiNghiepVu("Không tìm thấy khách");
  if (user.vaiTro !== "CHU" && user.coSoId !== k.coSoId) throw new LoiNghiepVu("Khách thuộc cơ sở khác");
  return k;
}

/** Lễ tân duyệt hồ sơ tự đăng ký (BR-23). */
export async function duyetKhach(id: number, user: NguoiDungPhien) {
  return db.transaction(async (tx) => {
    const k = await layKhachKhoa(tx, id, user);
    if (k.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Hồ sơ không ở trạng thái chờ duyệt");
    await tx.update(khachHang).set({ trangThai: "HOAT_DONG" }).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "DUYET_KHACH", doiTuong: k.maKh, coSoId: k.coSoId });
  });
}

/** Từ chối hồ sơ tự đăng ký: chuyển NGUNG, giữ lịch sử. */
export async function tuChoiKhach(id: number, lyDo: string, user: NguoiDungPhien) {
  if (!lyDo.trim()) throw new LoiNghiepVu("Ghi lý do từ chối");
  return db.transaction(async (tx) => {
    const k = await layKhachKhoa(tx, id, user);
    if (k.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Hồ sơ không ở trạng thái chờ duyệt");
    await tx.update(khachHang).set({ trangThai: "NGUNG", ghiChu: [k.ghiChu, "Từ chối: " + lyDo.trim()].filter(Boolean).join("\n") }).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "TU_CHOI_KHACH", doiTuong: k.maKh, lyDo, coSoId: k.coSoId });
  });
}

/** BR-29: xoá = chuyển NGUNG (chỉ Chủ). */
export async function xoaMemKhach(id: number, lyDo: string, user: NguoiDungPhien) {
  if (!co(user.vaiTro, "XOA_KHACH")) throw new LoiNghiepVu("Chỉ Chủ trung tâm được xoá hồ sơ");
  if (!lyDo.trim()) throw new LoiNghiepVu("Ghi lý do xoá");
  return db.transaction(async (tx) => {
    const k = await layKhachKhoa(tx, id, user);
    await tx.update(khachHang).set({ trangThai: "NGUNG" }).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "XOA_MEM", doiTuong: k.maKh, giaTriCu: { trangThai: k.trangThai }, giaTriMoi: { trangThai: "NGUNG" }, lyDo, coSoId: k.coSoId });
  });
}

export async function khoiPhucKhach(id: number, user: NguoiDungPhien) {
  if (!co(user.vaiTro, "XOA_KHACH")) throw new LoiNghiepVu("Chỉ Chủ trung tâm được khôi phục hồ sơ");
  return db.transaction(async (tx) => {
    const k = await layKhachKhoa(tx, id, user);
    if (k.gopVaoId) throw new LoiNghiepVu("Hồ sơ đã gộp, không khôi phục được");
    await tx.update(khachHang).set({ trangThai: "HOAT_DONG" }).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "KHOI_PHUC", doiTuong: k.maKh, coSoId: k.coSoId });
  });
}

/** FR-KH-06: cấp lại QR cá nhân, QR cũ hết tác dụng ngay. */
export async function capLaiQr(id: number, lyDo: string, user: NguoiDungPhien) {
  return db.transaction(async (tx) => {
    const k = await layKhachKhoa(tx, id, user);
    const moi = tokenNgauNhien();
    await tx.update(khachHang).set({ qrToken: moi }).where(eq(khachHang.id, id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "CAP_LAI_QR", doiTuong: k.maKh, lyDo: lyDo || "Cấp lại QR", coSoId: k.coSoId });
    return moi;
  });
}

/** FR-KH-04: gộp hồ sơ B vào A, giữ toàn bộ thẻ, lượt, phiếu thu. */
export async function gopHoSo(giuId: number, gopId: number, user: NguoiDungPhien) {
  if (giuId === gopId) throw new LoiNghiepVu("Chọn 2 hồ sơ khác nhau");
  if (!co(user.vaiTro, "DIEU_CHINH_THE")) throw new LoiNghiepVu("Chỉ Chủ hoặc Quản lý được gộp hồ sơ");
  return db.transaction(async (tx) => {
    const a = await layKhachKhoa(tx, giuId, user);
    const b = await layKhachKhoa(tx, gopId, user);
    for (const t of [theVe, ghiDanh, checkIn, donHang, phieuThu, lienHeCanhBao]) {
      await tx.update(t).set({ khachHangId: a.id }).where(eq(t.khachHangId, b.id));
    }
    await tx.update(khachHang).set({ trangThai: "NGUNG", gopVaoId: a.id }).where(eq(khachHang.id, b.id));
    if (a.trangThai === "CHO_DUYET" && b.trangThai === "HOAT_DONG") await tx.update(khachHang).set({ trangThai: "HOAT_DONG" }).where(eq(khachHang.id, a.id));
    await ghiNhatKy(tx, user, { module: "Khách hàng", hanhDong: "GOP_HO_SO", doiTuong: `${b.maKh} → ${a.maKh}`, coSoId: a.coSoId });
  });
}
