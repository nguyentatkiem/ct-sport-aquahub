// Dịch vụ check-in: đọc dữ liệu, gọi lõi luật, ghi kết quả trong 1 giao dịch có khoá dòng (NFR-03).
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db, type Exec, type Tx } from "@/db";
import { checkIn, coSo, donHang, ghiDanh, giaoVien, khachHang, lopHoc, theVe } from "@/db/schema";
import { quyetDinhCheckIn, datDieuKienThanhToan, LY_DO_TEXT, type TheInput, type LyDo } from "@/lib/checkin-engine";
import { ngayVN } from "@/lib/time";
import { maXacNhan } from "@/lib/text";
import { docCaiDat } from "./settings";
import { ghiNhatKy } from "./audit";
import type { NguoiDungPhien } from "./auth";
import { co } from "@/lib/permissions";

export type Kenh = "KHACH_TU_QUET" | "LE_TAN" | "KIOSK";

export type KetQuaView = {
  checkInId: number | null;
  ketQua: "HOP_LE" | "CANH_BAO" | "BI_CHAN" | "VUOT_CHAN" | "DA_CHECKIN";
  mau: "XANH" | "VANG" | "DO";
  lyDo: string | null;
  lyDoText: string | null;
  thoiGian: string; // ISO, giờ máy chủ
  maXacNhan: string | null;
  trungLap: boolean;
  lanCheckinTruoc: string | null;
  khach: { id: number; hoTen: string; maKh: string };
  coSo: { id: number; ten: string };
  the: {
    id: number;
    maThe: string;
    ten: string;
    tenEn: string | null;
    soLuotGoc: number | null;
    conLai: number | null;
    ngayMua: string;
    ngayHetHan: string | null;
  } | null;
  lop: { id: number; ten: string; giaoVien: string | null } | null;
  ghiDanh: { tenKhoaHoc: string; buoi: number; tong: number | null; trangThai: string } | null;
  sapHet: { conLuot: number | null; ngayHetHan: string | null; conNgay: number | null } | null;
  baoLuuDen: string | null;
};

const CHO_VAO = ["HOP_LE", "CANH_BAO", "VUOT_CHAN"] as const;

async function dongTheInput(tx: Exec, khachHangId: number, homNay: string, cauHinhTt: string): Promise<(TheInput & { maThe: string; tenSanPhamEn: string | null })[]> {
  const rows = await tx
    .select({ t: theVe, d: donHang })
    .from(theVe)
    .leftJoin(donHang, eq(donHang.id, theVe.donHangId))
    .where(eq(theVe.khachHangId, khachHangId));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.t.id);
  const dem = await tx
    .select({
      theVeId: checkIn.theVeId,
      n: sql<number>`count(*)::int`,
      cuoi: sql<Date>`max(${checkIn.thoiGian})`,
    })
    .from(checkIn)
    .where(and(inArray(checkIn.theVeId, ids), eq(checkIn.ngayVn, homNay), inArray(checkIn.ketQua, ["HOP_LE", "CANH_BAO"])))
    .groupBy(checkIn.theVeId);
  const map = new Map(dem.map((d) => [d.theVeId, d]));
  return rows.map(({ t, d }) => ({
    id: t.id,
    maThe: t.maThe,
    tenSanPham: t.tenSanPham,
    tenSanPhamEn: t.tenSanPhamEn,
    coSoBanId: t.coSoBanId,
    soLuotGoc: t.soLuotGoc,
    soLuotConLai: t.soLuotConLai,
    hanDungNgay: t.hanDungNgay,
    mocTinhHan: t.mocTinhHan,
    luatChan: t.luatChan,
    hanhDongKhiViPham: t.hanhDongKhiViPham,
    dungLienCoSo: t.dungLienCoSo,
    coSoApDung: t.coSoApDung,
    toiDaLuotMoiNgay: t.toiDaLuotMoiNgay,
    nguongCanhBaoLuot: t.nguongCanhBaoLuot,
    nguongCanhBaoNgay: t.nguongCanhBaoNgay,
    ngayMua: t.ngayMua,
    ngayKichHoat: t.ngayKichHoat,
    ngayHetHan: t.ngayHetHan,
    soNgayDaBaoLuu: t.soNgayDaBaoLuu,
    baoLuuTu: t.baoLuuTu,
    baoLuuDen: t.baoLuuDen,
    trangThai: t.trangThai,
    daDatThanhToan: t.laChuyenDoi ? true : datDieuKienThanhToan(cauHinhTt, d ? { giaThucThu: d.giaThucThu, daThu: d.daThu, conNo: d.conNo } : null),
    soLuotTruHomNay: map.get(t.id)?.n ?? 0,
    lanCuoiHomNay: map.get(t.id)?.cuoi ? new Date(map.get(t.id)!.cuoi) : null,
  }));
}

/** Dựng dữ liệu màn kết quả M3 từ một bản ghi check-in. */
export async function xemKetQua(ex: Exec, id: number, trungLap = false): Promise<KetQuaView> {
  const [r] = await ex
    .select({ c: checkIn, k: khachHang, cs: coSo, t: theVe, l: lopHoc, gv: giaoVien, gd: ghiDanh })
    .from(checkIn)
    .innerJoin(khachHang, eq(khachHang.id, checkIn.khachHangId))
    .innerJoin(coSo, eq(coSo.id, checkIn.coSoId))
    .leftJoin(theVe, eq(theVe.id, checkIn.theVeId))
    .leftJoin(lopHoc, eq(lopHoc.id, checkIn.lopHocId))
    .leftJoin(giaoVien, eq(giaoVien.id, checkIn.giaoVienId))
    .leftJoin(ghiDanh, eq(ghiDanh.id, checkIn.ghiDanhId))
    .where(eq(checkIn.id, id));
  const { c, k, cs, t, l, gv, gd } = r;
  return {
    checkInId: c.id,
    ketQua: c.ketQua as KetQuaView["ketQua"],
    mau: c.mau as KetQuaView["mau"],
    lyDo: c.lyDo,
    lyDoText: c.lyDoText,
    thoiGian: c.thoiGian.toISOString(),
    maXacNhan: c.maXacNhan,
    trungLap,
    lanCheckinTruoc: null,
    khach: { id: k.id, hoTen: k.hoTen, maKh: k.maKh },
    coSo: { id: cs.id, ten: cs.ten },
    the: t
      ? {
          id: t.id,
          maThe: t.maThe,
          ten: t.tenSanPham,
          tenEn: t.tenSanPhamEn,
          soLuotGoc: t.soLuotGoc,
          conLai: c.soLuotConSau ?? t.soLuotConLai,
          ngayMua: t.ngayMua,
          ngayHetHan: t.ngayHetHan,
        }
      : null,
    lop: l ? { id: l.id, ten: l.ten, giaoVien: gv?.hoTen ?? null } : null,
    ghiDanh: gd ? { tenKhoaHoc: gd.tenKhoaHoc, buoi: c.soBuoiSau ?? gd.soBuoiDaHoc, tong: gd.soBuoiTotNghiep ?? gd.soBuoiHocGoc, trangThai: gd.trangThai } : null,
    sapHet: c.canhBaoSapHet ? JSON.parse(c.canhBaoSapHet) : null,
    baoLuuDen: null,
  };
}

/** Cộng buổi học khi quét QR lớp (BR-02, BR-27). */
async function congBuoiHoc(tx: Tx, khachHangId: number, lopHocId: number | null | undefined, homNay: string) {
  if (!lopHocId) return null;
  const [gd] = await tx
    .select()
    .from(ghiDanh)
    .where(and(eq(ghiDanh.khachHangId, khachHangId), eq(ghiDanh.lopHocId, lopHocId), inArray(ghiDanh.trangThai, ["DANG_HOC", "DU_DIEU_KIEN_TOT_NGHIEP"])))
    .orderBy(desc(ghiDanh.id))
    .limit(1)
    .for("update");
  if (!gd) return null;
  if (gd.baoLuuTu && gd.baoLuuDen && gd.baoLuuTu <= homNay && homNay <= gd.baoLuuDen) return null;
  const buoi = gd.soBuoiDaHoc + 1;
  const tong = gd.soBuoiTotNghiep ?? gd.soBuoiHocGoc;
  const trangThai = gd.trangThai === "DANG_HOC" && tong != null && buoi >= tong ? "DU_DIEU_KIEN_TOT_NGHIEP" : gd.trangThai;
  await tx.update(ghiDanh).set({ soBuoiDaHoc: buoi, trangThai }).where(eq(ghiDanh.id, gd.id));
  return { ghiDanhId: gd.id, giaoVienId: gd.giaoVienId, buoi };
}

async function laKhachMoi(tx: Tx, khachHangId: number) {
  const [x] = await tx
    .select({ id: checkIn.id })
    .from(checkIn)
    .where(and(eq(checkIn.khachHangId, khachHangId), inArray(checkIn.ketQua, [...CHO_VAO])))
    .limit(1);
  return !x;
}

export async function thucHienCheckIn(opts: {
  khachHangId: number;
  coSoId: number;
  lopHocId?: number | null;
  maQrId?: number | null;
  kenh: Kenh;
  nguoiThaoTac?: NguoiDungPhien | null;
  now?: Date;
}): Promise<KetQuaView> {
  const now = opts.now ?? new Date();
  const homNay = ngayVN(now);
  const cauHinh = await docCaiDat();

  return db.transaction(async (tx) => {
    // Khoá theo khách: các lượt quét đồng thời của cùng khách chạy tuần tự
    const [k] = await tx.select().from(khachHang).where(eq(khachHang.id, opts.khachHangId)).for("update");
    if (!k) throw new Error("Không tìm thấy khách");
    const [cs] = await tx.select().from(coSo).where(eq(coSo.id, opts.coSoId));
    if (!cs) throw new Error("Không tìm thấy cơ sở");

    // BR-05: quét lại trong 5 phút trả kết quả lần trước
    const [gan] = await tx
      .select({ id: checkIn.id })
      .from(checkIn)
      .where(and(eq(checkIn.khachHangId, k.id), eq(checkIn.coSoId, cs.id), gt(checkIn.thoiGian, new Date(now.getTime() - 5 * 60000)), inArray(checkIn.ketQua, ["HOP_LE", "CANH_BAO", "BI_CHAN"])))
      .orderBy(desc(checkIn.thoiGian))
      .limit(1);
    if (gan) return xemKetQua(tx, gan.id, true);

    const cards = await dongTheInput(tx, k.id, homNay, cauHinh.theDuocDungKhi);
    if (cards.length) {
      await tx.select({ id: theVe.id }).from(theVe).where(inArray(theVe.id, cards.map((c) => c.id))).for("update");
    }
    const kq = quyetDinhCheckIn({ homNay, coSoId: cs.id, khach: { trangThai: k.trangThai }, cacThe: cards });

    const [lop] = opts.lopHocId
      ? await tx.select({ l: lopHoc, gv: giaoVien }).from(lopHoc).leftJoin(giaoVien, eq(giaoVien.id, lopHoc.giaoVienId)).where(eq(lopHoc.id, opts.lopHocId))
      : [];

    const the = kq.the as (typeof cards)[number] | null;

    if (kq.ketQua === "DA_CHECKIN") {
      // BR-04: không trừ, không tạo lượt mới
      return {
        checkInId: null,
        ketQua: "DA_CHECKIN",
        mau: kq.mau,
        lyDo: kq.lyDo,
        lyDoText: LY_DO_TEXT.DA_CHECKIN_HOM_NAY,
        thoiGian: now.toISOString(),
        maXacNhan: null,
        trungLap: false,
        lanCheckinTruoc: kq.lanCheckinTruoc?.toISOString() ?? null,
        khach: { id: k.id, hoTen: k.hoTen, maKh: k.maKh },
        coSo: { id: cs.id, ten: cs.ten },
        the: the
          ? { id: the.id, maThe: the.maThe, ten: the.tenSanPham, tenEn: the.tenSanPhamEn, soLuotGoc: the.soLuotGoc, conLai: the.soLuotConLai, ngayMua: the.ngayMua, ngayHetHan: kq.ngayHetHan }
          : null,
        lop: lop ? { id: lop.l.id, ten: lop.l.ten, giaoVien: lop.gv?.hoTen ?? null } : null,
        ghiDanh: null,
        sapHet: null,
        baoLuuDen: null,
      } satisfies KetQuaView;
    }

    const choVao = kq.ketQua === "HOP_LE" || kq.ketQua === "CANH_BAO";
    if (the && choVao) {
      await tx
        .update(theVe)
        .set({
          soLuotConLai: kq.truLuot ? sql`${theVe.soLuotConLai} - 1` : theVe.soLuotConLai,
          soLuotDaDung: sql`${theVe.soLuotDaDung} + 1`,
          ...(kq.kichHoat ? { ngayKichHoat: kq.kichHoat.ngayKichHoat, ngayHetHan: kq.kichHoat.ngayHetHan } : {}),
        })
        .where(eq(theVe.id, the.id));
    }
    const buoi = choVao ? await congBuoiHoc(tx, k.id, opts.lopHocId, homNay) : null;
    const moi = choVao ? await laKhachMoi(tx, k.id) : null;

    const [row] = await tx
      .insert(checkIn)
      .values({
        thoiGian: now,
        ngayVn: homNay,
        khachHangId: k.id,
        theVeId: the?.id ?? null,
        lopHocId: lop?.l.id ?? null,
        ghiDanhId: buoi?.ghiDanhId ?? null,
        giaoVienId: lop?.l.giaoVienId ?? buoi?.giaoVienId ?? null,
        coSoId: cs.id,
        maQrId: opts.maQrId ?? null,
        soLuotConSau: choVao ? kq.soLuotConSau : the?.soLuotConLai ?? null,
        soBuoiSau: buoi?.buoi ?? null,
        ketQua: kq.ketQua,
        mau: kq.mau,
        lyDo: kq.lyDo,
        lyDoText: kq.lyDo ? LY_DO_TEXT[kq.lyDo as LyDo] : null,
        truLuot: kq.truLuot && choVao,
        nguoiThaoTacId: opts.nguoiThaoTac?.id ?? null,
        kenh: opts.kenh,
        maXacNhan: maXacNhan(),
        loaiKhachTrongNgay: moi == null ? null : moi ? "MOI" : "CU",
        canhBaoSapHet: kq.sapHet ? JSON.stringify(kq.sapHet) : null,
      })
      .returning({ id: checkIn.id });

    if (opts.kenh === "LE_TAN" && opts.nguoiThaoTac) {
      await ghiNhatKy(tx, opts.nguoiThaoTac, { module: "Check-in", hanhDong: "CHECKIN_HO", doiTuong: k.maKh, giaTriMoi: { ketQua: kq.ketQua }, coSoId: cs.id });
    }
    const view = await xemKetQua(tx, row.id);
    view.baoLuuDen = kq.baoLuuDen;
    return view;
  });
}

/** BR-11: Quản lý/Chủ cho vào 1 lần khi bị chặn, bắt buộc lý do. */
export async function vuotChan(opts: { checkInId: number; lyDo: string; user: NguoiDungPhien; now?: Date }): Promise<KetQuaView> {
  if (!co(opts.user.vaiTro, "VUOT_CHAN")) throw new Error("Lễ tân không có quyền vượt chặn");
  const lyDo = opts.lyDo.trim();
  if (lyDo.length < 3) throw new Error("Bắt buộc ghi lý do vượt chặn");
  const now = opts.now ?? new Date();
  return db.transaction(async (tx) => {
    const [goc] = await tx.select().from(checkIn).where(eq(checkIn.id, opts.checkInId));
    if (!goc) throw new Error("Không tìm thấy lượt check-in");
    if (goc.ketQua !== "BI_CHAN") throw new Error("Chỉ vượt chặn lượt đang bị chặn");
    if (opts.user.vaiTro !== "CHU" && opts.user.coSoId !== goc.coSoId) throw new Error("Lượt check-in thuộc cơ sở khác");
    await tx.select().from(khachHang).where(eq(khachHang.id, goc.khachHangId)).for("update");
    const [daVuot] = await tx.select({ id: checkIn.id }).from(checkIn).where(eq(checkIn.vuotChanTuId, goc.id));
    if (daVuot) return xemKetQua(tx, daVuot.id, true);
    const buoi = await congBuoiHoc(tx, goc.khachHangId, goc.lopHocId, ngayVN(now));
    const moi = await laKhachMoi(tx, goc.khachHangId);
    const [row] = await tx
      .insert(checkIn)
      .values({
        thoiGian: now,
        ngayVn: ngayVN(now),
        khachHangId: goc.khachHangId,
        theVeId: goc.theVeId,
        lopHocId: goc.lopHocId,
        ghiDanhId: buoi?.ghiDanhId ?? null,
        giaoVienId: goc.giaoVienId ?? buoi?.giaoVienId ?? null,
        coSoId: goc.coSoId,
        maQrId: goc.maQrId,
        soLuotConSau: goc.soLuotConSau,
        soBuoiSau: buoi?.buoi ?? null,
        ketQua: "VUOT_CHAN",
        mau: "XANH",
        lyDo: goc.lyDo,
        lyDoText: lyDo,
        truLuot: false,
        nguoiThaoTacId: opts.user.id,
        vuotChanTuId: goc.id,
        kenh: "LE_TAN",
        maXacNhan: maXacNhan(),
        loaiKhachTrongNgay: moi ? "MOI" : "CU",
      })
      .returning({ id: checkIn.id });
    await ghiNhatKy(tx, opts.user, {
      module: "Check-in",
      hanhDong: "VUOT_CHAN",
      doiTuong: `CI${goc.id}`,
      giaTriCu: { ketQua: "BI_CHAN", lyDo: goc.lyDoText },
      giaTriMoi: { ketQua: "VUOT_CHAN" },
      lyDo,
      coSoId: goc.coSoId,
    });
    return xemKetQua(tx, row.id);
  });
}
