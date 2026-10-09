"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { coSo, giaoVien, giaoVienCoSo, khachHang, lopHoc, maQr, nguoiDung, sanPham } from "@/db/schema";
import { canDangNhap, canQuyen, kiemTraCoSo } from "@/server/auth";
import { chay, chuoi, so, soTien, type KetQuaAction } from "@/server/action";
import { ghiNhatKy } from "@/server/audit";
import { LoiNghiepVu } from "@/server/sales";
import { tokenNgauNhien } from "@/lib/text";
import { ghiCaiDat } from "@/server/settings";
import { bamMatKhau } from "@/server/password";
import { chuanSdt } from "@/lib/text";

// ---------- Sản phẩm (FR-SP, chỉ Chủ) ----------
function docSanPham(fd: FormData) {
  const loai = chuoi(fd.get("loai"));
  if (!["THE_VE", "KHOA_HOC"].includes(loai)) throw new LoiNghiepVu("Chọn loại sản phẩm");
  const ten = chuoi(fd.get("ten"));
  if (!ten) throw new LoiNghiepVu("Nhập tên sản phẩm");
  const coSoApDung = fd.getAll("coSoApDung").map(Number).filter(Boolean);
  const base = {
    loai,
    ten,
    tenEn: chuoi(fd.get("tenEn")) || null,
    giaNiemYet: soTien(fd.get("giaNiemYet")),
    coSoApDung: coSoApDung.length ? coSoApDung : null,
    choBaoLuu: fd.get("choBaoLuu") === "on",
    baoLuuToiDaNgay: fd.get("choBaoLuu") === "on" ? so(fd.get("baoLuuToiDaNgay")) ?? 30 : null,
    updatedAt: new Date(),
  };
  if (base.giaNiemYet < 0) throw new LoiNghiepVu("Giá không hợp lệ");
  if (loai === "THE_VE") {
    const soLuot = fd.get("khongGioiHanLuot") === "on" ? null : so(fd.get("soLuot"));
    const han = fd.get("khongHan") === "on" ? null : so(fd.get("hanDungNgay"));
    if (soLuot == null && han == null) throw new LoiNghiepVu("Thẻ phải có số lượt hoặc hạn dùng");
    if (soLuot != null && soLuot <= 0) throw new LoiNghiepVu("Số lượt phải lớn hơn 0");
    if (han != null && han <= 0) throw new LoiNghiepVu("Hạn dùng phải lớn hơn 0 ngày");
    return {
      ...base,
      soLuot,
      hanDungNgay: han,
      mocTinhHan: chuoi(fd.get("mocTinhHan")) || "NGAY_MUA",
      luatChan: chuoi(fd.get("luatChan")) || "HET_LUOT_HOAC_HET_HAN",
      hanhDongKhiViPham: chuoi(fd.get("hanhDongKhiViPham")) || "CHAN",
      dungLienCoSo: fd.get("dungLienCoSo") === "on",
      toiDaLuotMoiNgay: Math.max(1, so(fd.get("toiDaLuotMoiNgay")) ?? 1),
      nguongCanhBaoLuot: Math.max(0, so(fd.get("nguongCanhBaoLuot")) ?? 3),
      nguongCanhBaoNgay: Math.max(0, so(fd.get("nguongCanhBaoNgay")) ?? 7),
      soBuoiHoc: null,
      soBuoiTotNghiep: null,
      theVeKemTheoId: null,
    };
  }
  const soBuoi = so(fd.get("soBuoiHoc"));
  if (!soBuoi || soBuoi <= 0) throw new LoiNghiepVu("Nhập số buổi học");
  return {
    ...base,
    soLuot: null,
    hanDungNgay: null,
    soBuoiHoc: soBuoi,
    soBuoiTotNghiep: so(fd.get("soBuoiTotNghiep")) ?? soBuoi,
    theVeKemTheoId: so(fd.get("theVeKemTheoId")),
  };
}

export async function luuSanPhamAction(id: number | null, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canQuyen("SUA_SAN_PHAM");
    const v = docSanPham(fd);
    if (id) {
      const [cu] = await db.select().from(sanPham).where(eq(sanPham.id, id));
      await db.update(sanPham).set(v).where(eq(sanPham.id, id));
      await ghiNhatKy(db, u, { module: "Sản phẩm", hanhDong: "SUA_SAN_PHAM", doiTuong: `SP${id} ${v.ten}`, giaTriCu: cu, giaTriMoi: v });
    } else {
      const [m] = await db.insert(sanPham).values(v).returning();
      await ghiNhatKy(db, u, { module: "Sản phẩm", hanhDong: "TAO_SAN_PHAM", doiTuong: `SP${m.id} ${v.ten}`, giaTriMoi: v });
    }
  });
  if (!r.ok) return r;
  revalidatePath("/admin/san-pham");
  redirect("/admin/san-pham");
}

export async function doiTrangThaiSanPhamAction(id: number, trangThai: "DANG_BAN" | "NGUNG_BAN") {
  return chay(async () => {
    const u = await canQuyen("SUA_SAN_PHAM");
    await db.update(sanPham).set({ trangThai, updatedAt: new Date() }).where(eq(sanPham.id, id));
    await ghiNhatKy(db, u, { module: "Sản phẩm", hanhDong: trangThai === "NGUNG_BAN" ? "NGUNG_BAN" : "MO_BAN", doiTuong: `SP${id}` });
    revalidatePath("/admin/san-pham");
  });
}

export async function nhanBanSanPhamAction(id: number) {
  const r = await chay(async () => {
    const u = await canQuyen("SUA_SAN_PHAM");
    const [sp] = await db.select().from(sanPham).where(eq(sanPham.id, id));
    if (!sp) throw new LoiNghiepVu("Không tìm thấy sản phẩm");
    const rest: Partial<typeof sp> = { ...sp };
    delete rest.id;
    delete rest.createdAt;
    delete rest.updatedAt;
    const [m] = await db
      .insert(sanPham)
      .values({ ...(rest as typeof sanPham.$inferInsert), ten: sp.ten + " (bản sao)", trangThai: "NGUNG_BAN", laTheChuyenDoi: false })
      .returning();
    await ghiNhatKy(db, u, { module: "Sản phẩm", hanhDong: "NHAN_BAN", doiTuong: `SP${id} → SP${m.id}` });
    return m.id;
  });
  if (!r.ok) return r;
  redirect(`/admin/san-pham/${r.data}`);
}

// ---------- Giáo viên ----------
export async function luuGiaoVienAction(id: number | null, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canQuyen("QUAN_LY_LOP_GV_QR");
    const hoTen = chuoi(fd.get("hoTen"));
    if (!hoTen) throw new LoiNghiepVu("Nhập tên giáo viên");
    let coSoIds = fd.getAll("coSoIds").map(Number).filter(Boolean);
    if (u.vaiTro !== "CHU") coSoIds = [u.coSoId!];
    if (!coSoIds.length) throw new LoiNghiepVu("Chọn ít nhất 1 cơ sở dạy");
    const v = { hoTen, sdt: chuanSdt(fd.get("sdt") as string) || null, trangThai: chuoi(fd.get("trangThai")) || "DANG_LAM", ghiChu: chuoi(fd.get("ghiChu")) || null };
    await db.transaction(async (tx) => {
      let gid = id;
      if (id) {
        if (u.vaiTro !== "CHU") {
          const cs = await tx.select().from(giaoVienCoSo).where(eq(giaoVienCoSo.giaoVienId, id));
          if (!cs.some((c) => c.coSoId === u.coSoId)) throw new LoiNghiepVu("Giáo viên không dạy ở cơ sở của bạn");
        }
        await tx.update(giaoVien).set(v).where(eq(giaoVien.id, id));
        if (u.vaiTro === "CHU") await tx.delete(giaoVienCoSo).where(eq(giaoVienCoSo.giaoVienId, id));
      } else {
        const [m] = await tx.insert(giaoVien).values(v).returning();
        gid = m.id;
      }
      if (u.vaiTro === "CHU" || !id) for (const c of coSoIds) await tx.insert(giaoVienCoSo).values({ giaoVienId: gid!, coSoId: c }).onConflictDoNothing();
      await ghiNhatKy(tx, u, { module: "Giáo viên", hanhDong: id ? "SUA_GV" : "TAO_GV", doiTuong: hoTen, giaTriMoi: { ...v, coSoIds } });
    });
  });
  if (!r.ok) return r;
  revalidatePath("/admin/giao-vien");
  redirect("/admin/giao-vien");
}

// ---------- Lớp học ----------
export async function luuLopAction(id: number | null, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  const r = await chay(async () => {
    const u = await canQuyen("QUAN_LY_LOP_GV_QR");
    const coSoId = u.vaiTro === "CHU" ? Number(fd.get("coSoId")) : u.coSoId!;
    if (!coSoId) throw new LoiNghiepVu("Chọn cơ sở");
    const ten = chuoi(fd.get("ten"));
    if (!ten) throw new LoiNghiepVu("Nhập tên lớp");
    const sanPhamId = Number(fd.get("sanPhamId"));
    const [sp] = await db.select().from(sanPham).where(eq(sanPham.id, sanPhamId));
    if (!sp || sp.loai !== "KHOA_HOC") throw new LoiNghiepVu("Chọn khoá học");
    const v = { ten, coSoId, sanPhamId, giaoVienId: so(fd.get("giaoVienId")), lichText: chuoi(fd.get("lichText")) || null, trangThai: chuoi(fd.get("trangThai")) || "DANG_HOC" };
    if (id) {
      const [cu] = await db.select().from(lopHoc).where(eq(lopHoc.id, id));
      await kiemTraCoSo(u, cu.coSoId);
      // FR-LH-02: đổi GV lớp không làm đổi GV trong các lượt check-in cũ (check_in lưu giao_vien_id riêng)
      await db.update(lopHoc).set(v).where(eq(lopHoc.id, id));
      await ghiNhatKy(db, u, { module: "Lớp học", hanhDong: "SUA_LOP", doiTuong: ten, giaTriCu: cu, giaTriMoi: v, coSoId });
    } else {
      const [m] = await db.insert(lopHoc).values(v).returning();
      if (fd.get("taoQr") === "on") await db.insert(maQr).values({ loai: "LOP", ten, coSoId, lopHocId: m.id, token: tokenNgauNhien() });
      await ghiNhatKy(db, u, { module: "Lớp học", hanhDong: "TAO_LOP", doiTuong: ten, giaTriMoi: v, coSoId });
    }
  });
  if (!r.ok) return r;
  revalidatePath("/admin/lop");
  redirect("/admin/lop");
}

// ---------- Mã QR (FR-LH-03, FR-LH-04) ----------
export async function taoQrAction(_: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canQuyen("QUAN_LY_LOP_GV_QR");
    const loai = chuoi(fd.get("loai"));
    let coSoId = u.vaiTro === "CHU" ? Number(fd.get("coSoId")) : u.coSoId!;
    let ten = chuoi(fd.get("ten"));
    let lopHocId: number | null = null;
    if (loai === "LOP") {
      const [l] = await db.select().from(lopHoc).where(eq(lopHoc.id, Number(fd.get("lopHocId"))));
      if (!l) throw new LoiNghiepVu("Chọn lớp");
      await kiemTraCoSo(u, l.coSoId);
      lopHocId = l.id;
      coSoId = l.coSoId;
      ten = ten || l.ten;
    } else if (loai !== "QUAY") throw new LoiNghiepVu("Chọn loại QR");
    if (!coSoId) throw new LoiNghiepVu("Chọn cơ sở");
    if (!ten) throw new LoiNghiepVu("Nhập tên QR");
    await db.insert(maQr).values({ loai, ten, coSoId, lopHocId, token: tokenNgauNhien() });
    await ghiNhatKy(db, u, { module: "Mã QR", hanhDong: "TAO_QR", doiTuong: ten, coSoId });
    revalidatePath("/admin/qr");
  });
}

/** Đổi mã: QR cũ hết hiệu lực ngay, sinh QR mới cùng lớp/quầy. */
export async function doiMaQrAction(id: number) {
  return chay(async () => {
    const u = await canQuyen("QUAN_LY_LOP_GV_QR");
    await db.transaction(async (tx) => {
      const [q] = await tx.select().from(maQr).where(eq(maQr.id, id)).for("update");
      if (!q) throw new LoiNghiepVu("Không tìm thấy QR");
      await kiemTraCoSo(u, q.coSoId);
      if (q.trangThai !== "HIEU_LUC") throw new LoiNghiepVu("QR đã hết hiệu lực");
      const [m] = await tx.insert(maQr).values({ loai: q.loai, ten: q.ten, coSoId: q.coSoId, lopHocId: q.lopHocId, token: tokenNgauNhien() }).returning();
      await tx.update(maQr).set({ trangThai: "HET_HIEU_LUC", thayTheBoiId: m.id }).where(eq(maQr.id, id));
      await ghiNhatKy(tx, u, { module: "Mã QR", hanhDong: "DOI_MA_QR", doiTuong: q.ten, coSoId: q.coSoId });
    });
    revalidatePath("/admin/qr");
  });
}

export async function tatQrAction(id: number) {
  return chay(async () => {
    const u = await canQuyen("QUAN_LY_LOP_GV_QR");
    const [q] = await db.select().from(maQr).where(eq(maQr.id, id));
    await kiemTraCoSo(u, q.coSoId);
    await db.update(maQr).set({ trangThai: "HET_HIEU_LUC" }).where(eq(maQr.id, id));
    await ghiNhatKy(db, u, { module: "Mã QR", hanhDong: "TAT_QR", doiTuong: q.ten, coSoId: q.coSoId });
    revalidatePath("/admin/qr");
  });
}

// ---------- Nhân viên (FR-HT-02, chỉ Chủ) ----------
export async function luuNhanVienAction(id: number | null, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canQuyen("QUAN_LY_TAI_KHOAN");
    const hoTen = chuoi(fd.get("hoTen"));
    const email = chuoi(fd.get("email")).toLowerCase() || null;
    const sdt = chuanSdt(chuoi(fd.get("sdt"))) || null;
    const vaiTro = chuoi(fd.get("vaiTro"));
    const coSoId = vaiTro === "CHU" ? null : so(fd.get("coSoId"));
    const matKhau = chuoi(fd.get("matKhau"));
    if (!hoTen) throw new LoiNghiepVu("Nhập họ tên");
    if (!email && !sdt) throw new LoiNghiepVu("Nhập SĐT hoặc email để đăng nhập");
    if (!["CHU", "QUAN_LY", "LE_TAN"].includes(vaiTro)) throw new LoiNghiepVu("Chọn vai trò");
    if (vaiTro !== "CHU" && !coSoId) throw new LoiNghiepVu("Quản lý và Lễ tân phải gán 1 cơ sở");
    if (!id && matKhau.length < 8) throw new LoiNghiepVu("Mật khẩu tối thiểu 8 ký tự");
    if (matKhau && matKhau.length < 8) throw new LoiNghiepVu("Mật khẩu tối thiểu 8 ký tự");
    const trung = await db
      .select({ id: nguoiDung.id })
      .from(nguoiDung)
      .where(and(id ? ne(nguoiDung.id, id) : sql`true`, sql`(${email ? sql`${nguoiDung.email} = ${email}` : sql`false`} or ${sdt ? sql`${nguoiDung.sdt} = ${sdt}` : sql`false`})`));
    if (trung.length) throw new LoiNghiepVu("SĐT hoặc email đã được dùng cho tài khoản khác");
    const v = { hoTen, email, sdt, vaiTro, coSoId, trangThai: chuoi(fd.get("trangThai")) || "HOAT_DONG" };
    if (id) {
      if (id === u.id && (vaiTro !== "CHU" || v.trangThai !== "HOAT_DONG")) throw new LoiNghiepVu("Không tự hạ quyền hoặc tự khoá tài khoản đang đăng nhập");
      const [cu] = await db.select().from(nguoiDung).where(eq(nguoiDung.id, id));
      const doiMk = matKhau ? { matKhauHash: await bamMatKhau(matKhau), phienBan: cu.phienBan + 1, soLanSai: 0, khoaDen: null } : {};
      const doiQuyen = cu.vaiTro !== vaiTro || cu.coSoId !== coSoId || v.trangThai !== "HOAT_DONG" ? { phienBan: cu.phienBan + 1 } : {};
      await db.update(nguoiDung).set({ ...v, ...doiQuyen, ...doiMk }).where(eq(nguoiDung.id, id));
      await ghiNhatKy(db, u, {
        module: "Nhân viên",
        hanhDong: matKhau ? "DAT_LAI_MAT_KHAU" : "SUA_NHAN_VIEN",
        doiTuong: hoTen,
        giaTriCu: { vaiTro: cu.vaiTro, coSoId: cu.coSoId, trangThai: cu.trangThai },
        giaTriMoi: { vaiTro, coSoId, trangThai: v.trangThai },
      });
    } else {
      await db.insert(nguoiDung).values({ ...v, matKhauHash: await bamMatKhau(matKhau) });
      await ghiNhatKy(db, u, { module: "Nhân viên", hanhDong: "TAO_NHAN_VIEN", doiTuong: hoTen, giaTriMoi: { vaiTro, coSoId } });
    }
    revalidatePath("/admin/nhan-vien");
  });
}

// ---------- Cài đặt & cơ sở (FR-HT-04, chỉ Chủ) ----------
export async function luuCaiDatAction(_: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canQuyen("CAI_DAT");
    const v = {
      tenTrungTam: chuoi(fd.get("tenTrungTam")) || "Trung tâm bơi",
      tenTrungTamEn: chuoi(fd.get("tenTrungTamEn")),
      logoUrl: chuoi(fd.get("logoUrl")) || null,
      hotline: chuoi(fd.get("hotline")),
      theDuocDungKhi: chuoi(fd.get("theDuocDungKhi")) || "DA_COC",
    };
    if (!["DA_THU_DU", "DA_COC", "NGAY_KHI_TAO"].includes(v.theDuocDungKhi)) throw new LoiNghiepVu("Giá trị không hợp lệ");
    if (v.logoUrl && !/^https:\/\//.test(v.logoUrl) && !v.logoUrl.startsWith("data:image/")) throw new LoiNghiepVu("Logo phải là đường dẫn https hoặc ảnh tải lên");
    for (const [k, val] of Object.entries(v)) await ghiCaiDat(db, k as "tenTrungTam", val);
    await ghiNhatKy(db, u, { module: "Cài đặt", hanhDong: "SUA_CAI_DAT", giaTriMoi: { ...v, logoUrl: v.logoUrl ? "(có logo)" : null } });
    revalidatePath("/", "layout");
  });
}

export async function luuCoSoAction(id: number | null, _: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canQuyen("CAI_DAT");
    const ma = chuoi(fd.get("ma")).toUpperCase();
    if (!/^[A-Z]{2}$/.test(ma)) throw new LoiNghiepVu("Mã cơ sở gồm đúng 2 chữ cái, VD LT");
    const v = { ma, ten: chuoi(fd.get("ten")), diaChi: chuoi(fd.get("diaChi")) || null, sdt: chuoi(fd.get("sdt")) || null, choTuDangKy: fd.get("choTuDangKy") === "on", trangThai: chuoi(fd.get("trangThai")) || "HOAT_DONG" };
    if (!v.ten) throw new LoiNghiepVu("Nhập tên cơ sở");
    const [trung] = await db.select({ id: coSo.id }).from(coSo).where(and(eq(coSo.ma, ma), id ? ne(coSo.id, id) : sql`true`));
    if (trung) throw new LoiNghiepVu("Mã cơ sở đã tồn tại");
    if (id) {
      const [cu] = await db.select().from(coSo).where(eq(coSo.id, id));
      if (cu.ma !== ma) {
        const [k] = await db.select({ id: khachHang.id }).from(khachHang).where(eq(khachHang.coSoId, id)).limit(1);
        if (k) throw new LoiNghiepVu("Cơ sở đã có khách: không đổi mã được (mã khách đã sinh theo mã cũ)");
      }
      await db.update(coSo).set(v).where(eq(coSo.id, id));
      await ghiNhatKy(db, u, { module: "Cơ sở", hanhDong: "SUA_CO_SO", doiTuong: v.ten, giaTriCu: cu, giaTriMoi: v });
    } else {
      await db.insert(coSo).values(v);
      await ghiNhatKy(db, u, { module: "Cơ sở", hanhDong: "TAO_CO_SO", doiTuong: v.ten, giaTriMoi: v });
    }
    revalidatePath("/admin/cai-dat");
  });
}

export async function doiMatKhauAction(_: KetQuaAction, fd: FormData): Promise<KetQuaAction> {
  return chay(async () => {
    const u = await canDangNhap();
    const { soMatKhau } = await import("@/server/password");
    const [nd] = await db.select().from(nguoiDung).where(eq(nguoiDung.id, u.id));
    if (!(await soMatKhau(chuoi(fd.get("cu")), nd.matKhauHash))) throw new LoiNghiepVu("Mật khẩu hiện tại không đúng");
    const moi = chuoi(fd.get("moi"));
    if (moi.length < 8) throw new LoiNghiepVu("Mật khẩu mới tối thiểu 8 ký tự");
    if (moi !== chuoi(fd.get("nhapLai"))) throw new LoiNghiepVu("Nhập lại mật khẩu không khớp");
    await db.update(nguoiDung).set({ matKhauHash: await bamMatKhau(moi), phienBan: nd.phienBan + 1 }).where(eq(nguoiDung.id, u.id));
    await ghiNhatKy(db, u, { module: "Nhân viên", hanhDong: "DOI_MAT_KHAU", doiTuong: u.hoTen });
    redirect("/login");
  });
}
