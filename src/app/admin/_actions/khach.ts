"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { khachHang, lienHeCanhBao, theVe } from "@/db/schema";
import { canDangNhap, coSoThaoTac, kiemTraCoSo } from "@/server/auth";
import { chay, chuoi, so, soTien, type KetQuaAction } from "@/server/action";
import {
  taoKhach,
  capNhatKhach,
  timKhachTrung,
  duyetKhach,
  tuChoiKhach,
  xoaMemKhach,
  khoiPhucKhach,
  capLaiQr,
  gopHoSo,
  anDanhHoaKhach,
  type DuLieuKhach,
} from "@/server/customers";
import { banTheVe, ghiDanhKhoaHoc, ghiNhanThu, huyPhieu, suaGiaThucThu, LoiNghiepVu } from "@/server/sales";
import { dieuChinhThe, baoLuuThe, baoLuuGhiDanh, xacNhanTotNghiep, type LoaiDieuChinh } from "@/server/cards";
import { ghiNhatKy } from "@/server/audit";

function docKhach(fd: FormData, coSoId: number): DuLieuKhach {
  const lhTen = chuoi(fd.get("lhHoTen"));
  const lhSdt = chuoi(fd.get("lhSdt"));
  return {
    hoTen: chuoi(fd.get("hoTen")),
    ngaySinh: chuoi(fd.get("ngaySinh")),
    sdt: chuoi(fd.get("sdt")) || null,
    lienHe: lhTen || lhSdt ? { hoTen: lhTen, sdt: lhSdt, quanHe: chuoi(fd.get("lhQuanHe")) || "KHAC" } : null,
    coSoId,
    ghiChu: chuoi(fd.get("ghiChu")) || null,
    ghiChuSucKhoe: chuoi(fd.get("ghiChuSucKhoe")) || null,
    dongYDuLieu: fd.get("dongY") === "on",
  };
}

const lam = (id: number) => {
  revalidatePath(`/admin/khach/${id}`);
  revalidatePath("/admin/khach");
};

export async function kiemTrungAction(d: { hoTen: string; ngaySinh: string; sdt?: string; sdtLienHe?: string }, boQuaId?: number) {
  await canDangNhap();
  if (!d.hoTen?.trim() || !d.ngaySinh) return [];
  return (await timKhachTrung(d, boQuaId)).map((x) => ({ id: x.id, maKh: x.maKh, hoTen: x.hoTen, trangThai: x.trangThai }));
}

export async function taoKhachAction(_: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  let id = 0;
  const r = await chay(async () => {
    const u = await canDangNhap();
    const cs = await coSoThaoTac(u, so(fd.get("coSoId")));
    const d = docKhach(fd, cs);
    if (fd.get("boQuaTrung") !== "1") {
      const trung = await timKhachTrung({ hoTen: d.hoTen, ngaySinh: d.ngaySinh, sdt: d.sdt, sdtLienHe: d.lienHe?.sdt });
      if (trung.length) throw new LoiNghiepVu(`Trùng hồ sơ ${trung.map((t) => t.maKh).join(", ")}. Kiểm tra lại hoặc bấm "Vẫn tạo hồ sơ mới".`);
    }
    const k = await taoKhach(d, { nguonTao: "NV_NHAP", user: u });
    id = k.id;
  });
  if (!r.ok) return r;
  revalidatePath("/admin/khach");
  redirect(fd.get("sau") === "ghi-danh" ? `/admin/khach/${id}/ghi-danh` : fd.get("sau") === "xem" ? `/admin/khach/${id}` : `/admin/khach/${id}/ban-the`);
}

export async function suaKhachAction(id: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canDangNhap();
    const [k] = await db.select().from(khachHang).where(eq(khachHang.id, id));
    await kiemTraCoSo(u, k.coSoId, k.maKh);
    const cs = u.vaiTro === "CHU" ? so(fd.get("coSoId")) ?? k.coSoId : k.coSoId;
    await capNhatKhach(id, docKhach(fd, cs), u);
  });
  if (!r.ok) return r;
  lam(id);
  redirect(`/admin/khach/${id}`);
}

export async function duyetAction(id: number) {
  return chay(async () => {
    const u = await canDangNhap();
    await duyetKhach(id, u);
    lam(id);
  });
}
export async function tuChoiAction(id: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await tuChoiKhach(id, lyDo, u);
    lam(id);
  });
}
export async function xoaKhachAction(id: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await xoaMemKhach(id, lyDo, u);
    lam(id);
  });
}
export async function khoiPhucAction(id: number) {
  return chay(async () => {
    const u = await canDangNhap();
    await khoiPhucKhach(id, u);
    lam(id);
  });
}
export async function capLaiQrAction(id: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await capLaiQr(id, lyDo, u);
    lam(id);
  });
}
export async function gopAction(giuId: number, maGop: string) {
  return chay(async () => {
    const u = await canDangNhap();
    const [b] = await db.select().from(khachHang).where(eq(khachHang.maKh, maGop.trim().toUpperCase()));
    if (!b) throw new LoiNghiepVu("Không tìm thấy mã khách cần gộp");
    await gopHoSo(giuId, b.id, u);
    lam(giuId);
  });
}

function docThu(fd: FormData, prefix = "") {
  const soTienThu = soTien(fd.get(prefix + "thu"));
  return soTienThu > 0 ? { soTien: soTienThu, hinhThuc: (chuoi(fd.get(prefix + "hinhThuc")) || "TIEN_MAT") as "TIEN_MAT" | "CHUYEN_KHOAN", ghiChu: chuoi(fd.get(prefix + "ghiChuThu")) || null } : null;
}

export async function banTheAction(khachId: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canDangNhap();
    const [k] = await db.select().from(khachHang).where(eq(khachHang.id, khachId));
    await kiemTraCoSo(u, k.coSoId, k.maKh);
    const cs = await coSoThaoTac(u, k.coSoId);
    return banTheVe({
      khachHangId: khachId,
      sanPhamId: Number(fd.get("sanPhamId")),
      coSoId: cs,
      giaThucThu: soTien(fd.get("giaThucThu")),
      lyDoGiam: chuoi(fd.get("lyDoGiam")) || null,
      thu: docThu(fd),
      user: u,
      soLuotChuyenDoi: so(fd.get("soLuotChuyenDoi")),
      ngayHetHanChuyenDoi: chuoi(fd.get("ngayHetHanChuyenDoi")) || null,
      anhTheGiay: chuoi(fd.get("anhTheGiay")) || null,
    });
  });
  if (!r.ok) return r;
  lam(khachId);
  redirect(`/admin/khach/${khachId}?tab=the&moi=1`);
}

export async function ghiDanhAction(khachId: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canDangNhap();
    const [k] = await db.select().from(khachHang).where(eq(khachHang.id, khachId));
    await kiemTraCoSo(u, k.coSoId, k.maKh);
    const cs = await coSoThaoTac(u, k.coSoId);
    const banKemId = so(fd.get("kemSanPhamId"));
    return ghiDanhKhoaHoc({
      khachHangId: khachId,
      sanPhamId: Number(fd.get("sanPhamId")),
      lopHocId: Number(fd.get("lopHocId")),
      giaoVienId: so(fd.get("giaoVienId")),
      coSoId: cs,
      giaThucThu: soTien(fd.get("giaThucThu")),
      lyDoGiam: chuoi(fd.get("lyDoGiam")) || null,
      thu: docThu(fd),
      ghiChu: chuoi(fd.get("ghiChu")) || null,
      banKem: banKemId
        ? { sanPhamId: banKemId, giaThucThu: soTien(fd.get("kemGiaThucThu")), lyDoGiam: chuoi(fd.get("kemLyDoGiam")) || null, thu: docThu(fd, "kem") }
        : null,
      user: u,
    });
  });
  if (!r.ok) return r;
  lam(khachId);
  redirect(`/admin/khach/${khachId}?tab=khoa&moi=1`);
}

export async function thuTienAction(khachId: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canDangNhap();
    const loai = chuoi(fd.get("loai")) as "COC" | "THANH_TOAN" | "HOAN_TIEN";
    const r = await ghiNhanThu({
      donHangId: Number(fd.get("donHangId")),
      loai,
      thu: { soTien: soTien(fd.get("soTien")), hinhThuc: (chuoi(fd.get("hinhThuc")) || "TIEN_MAT") as "TIEN_MAT", ghiChu: chuoi(fd.get("ghiChu")) || null },
      user: u,
    });
    lam(khachId);
    revalidatePath("/admin/thu-tien");
    return r.phieu.maPhieu;
  });
}

export async function huyPhieuAction(khachId: number, phieuId: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await huyPhieu({ phieuId, lyDo, user: u });
    lam(khachId);
    revalidatePath("/admin/thu-tien");
  });
}

export async function suaGiaAction(khachId: number, donHangId: number, giaMoi: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await suaGiaThucThu({ donHangId, giaMoi, lyDo, user: u });
    lam(khachId);
  });
}

export async function dieuChinhAction(khachId: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canDangNhap();
    await dieuChinhThe({
      theVeId: Number(fd.get("theVeId")),
      loai: chuoi(fd.get("loai")) as LoaiDieuChinh,
      soLuong: so(fd.get("soLuong")),
      theDichId: so(fd.get("theDichId")),
      lyDo: chuoi(fd.get("lyDo")),
      user: u,
    });
  });
  if (!r.ok) return r;
  lam(khachId);
  redirect(`/admin/khach/${khachId}?tab=the`);
}

export async function baoLuuAction(khachId: number, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canDangNhap();
    const p = { tu: chuoi(fd.get("tu")), den: chuoi(fd.get("den")), lyDo: chuoi(fd.get("lyDo")), user: u };
    if (fd.get("ghiDanhId")) await baoLuuGhiDanh({ ghiDanhId: Number(fd.get("ghiDanhId")), ...p });
    else await baoLuuThe({ theVeId: Number(fd.get("theVeId")), ...p });
  });
  if (!r.ok) return r;
  lam(khachId);
  redirect(`/admin/khach/${khachId}?tab=${fd.get("ghiDanhId") ? "khoa" : "the"}`);
}

export async function totNghiepAction(khachId: number, ghiDanhId: number) {
  return chay(async () => {
    const u = await canDangNhap();
    await xacNhanTotNghiep({ ghiDanhId, user: u });
    lam(khachId);
  });
}

/** FR-CB-02: đánh dấu đã gọi kèm kết quả. */
export async function ghiLienHeAction(theVeId: number, ketQua: string, ghiChu: string) {
  return chay(async () => {
    const u = await canDangNhap();
    const [t] = await db.select().from(theVe).where(eq(theVe.id, theVeId));
    if (!t) throw new LoiNghiepVu("Không tìm thấy thẻ");
    const [k] = await db.select().from(khachHang).where(eq(khachHang.id, t.khachHangId));
    await kiemTraCoSo(u, k.coSoId, k.maKh);
    await db.insert(lienHeCanhBao).values({ theVeId, khachHangId: k.id, nguoiGoiId: u.id, ketQua, ghiChu: ghiChu.trim() || null });
    await ghiNhatKy(db, u, { module: "Chăm sóc", hanhDong: "DA_GOI", doiTuong: k.maKh, giaTriMoi: { ketQua }, lyDo: ghiChu, coSoId: k.coSoId });
    revalidatePath("/admin/sap-het");
  });
}

export async function anDanhHoaAction(id: number, lyDo: string) {
  return chay(async () => {
    const u = await canDangNhap();
    await anDanhHoaKhach(id, lyDo, u);
    lam(id);
  });
}
