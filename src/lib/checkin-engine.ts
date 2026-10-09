// Lõi luật check-in (BR-01 → BR-13, BR-19, BR-23, BR-26).
// Hàm thuần: không đọc/ghi CSDL, nhận toàn bộ dữ liệu cần thiết và trả về quyết định.
import { congNgay, soNgayGiua } from "./time";

export type LuatChan = "HET_LUOT_HOAC_HET_HAN" | "CHI_HET_LUOT" | "CHI_HET_HAN";
export type HanhDong = "CHAN" | "CANH_BAO";
export type MocTinhHan = "NGAY_MUA" | "LAN_DAU_CHECKIN";
export type CauHinhThanhToan = "DA_THU_DU" | "DA_COC" | "NGAY_KHI_TAO";

export type TheInput = {
  id: number;
  tenSanPham: string;
  coSoBanId: number;
  soLuotGoc: number | null;
  soLuotConLai: number | null; // null = không giới hạn lượt
  hanDungNgay: number | null; // null = không hạn
  mocTinhHan: MocTinhHan | string;
  luatChan: LuatChan | string;
  hanhDongKhiViPham: HanhDong | string;
  dungLienCoSo: boolean;
  coSoApDung: number[] | null;
  toiDaLuotMoiNgay: number;
  nguongCanhBaoLuot: number;
  nguongCanhBaoNgay: number;
  ngayMua: string;
  ngayKichHoat: string | null;
  ngayHetHan: string | null;
  soNgayDaBaoLuu: number;
  baoLuuTu: string | null;
  baoLuuDen: string | null;
  trangThai: string; // HOAT_DONG | HUY
  daDatThanhToan: boolean; // đã xét theo BR-19
  soLuotTruHomNay: number; // số lượt đã trừ/cho vào bằng thẻ này hôm nay
  lanCuoiHomNay: Date | null;
};

export type KhachInput = { trangThai: string };

export type LyDo =
  | "CHO_DUYET"
  | "KHACH_NGUNG"
  | "KHONG_CO_THE"
  | "SAI_CO_SO"
  | "BAO_LUU"
  | "CHUA_THANH_TOAN"
  | "DA_CHECKIN_HOM_NAY"
  | "HET_LUOT"
  | "HET_HAN"
  | "HET_LUOT_VA_HET_HAN";

export type KetQuaEngine = {
  ketQua: "HOP_LE" | "CANH_BAO" | "BI_CHAN" | "DA_CHECKIN";
  mau: "XANH" | "VANG" | "DO";
  lyDo: LyDo | null;
  the: TheInput | null;
  truLuot: boolean;
  soLuotConSau: number | null;
  kichHoat: { ngayKichHoat: string; ngayHetHan: string | null } | null;
  ngayHetHan: string | null;
  sapHet: { conLuot: number | null; ngayHetHan: string | null; conNgay: number | null } | null;
  lanCheckinTruoc: Date | null;
  baoLuuDen: string | null;
};

const VO_HAN = "9999-12-31";

/** Ngày hết hạn hiệu lực. Thẻ tính hạn từ lần check-in đầu mà chưa kích hoạt: giả định kích hoạt hôm nay. */
export function hetHanHieuLuc(t: Pick<TheInput, "ngayHetHan" | "hanDungNgay" | "ngayKichHoat" | "mocTinhHan" | "soNgayDaBaoLuu">, homNay: string): string | null {
  if (t.ngayHetHan) return t.ngayHetHan;
  if (t.hanDungNgay == null) return null;
  if (t.mocTinhHan === "LAN_DAU_CHECKIN" && !t.ngayKichHoat) {
    return congNgay(homNay, t.hanDungNgay - 1 + (t.soNgayDaBaoLuu ?? 0));
  }
  return null;
}

/** Hạn khi bán (BR-09): NGAY_MUA -> ngày mua + hạn - 1; LAN_DAU_CHECKIN -> chưa có. */
export function hetHanKhiBan(ngayMua: string, hanDungNgay: number | null, moc: string): string | null {
  if (hanDungNgay == null) return null;
  if (moc === "LAN_DAU_CHECKIN") return null;
  return congNgay(ngayMua, hanDungNgay - 1);
}

export function dungDuocTaiCoSo(t: Pick<TheInput, "dungLienCoSo" | "coSoBanId" | "coSoApDung">, coSoId: number): boolean {
  if (!t.dungLienCoSo) return t.coSoBanId === coSoId;
  return !t.coSoApDung || t.coSoApDung.length === 0 || t.coSoApDung.includes(coSoId);
}

export function dangBaoLuu(t: Pick<TheInput, "baoLuuTu" | "baoLuuDen">, homNay: string): boolean {
  return !!t.baoLuuTu && !!t.baoLuuDen && t.baoLuuTu <= homNay && homNay <= t.baoLuuDen;
}

/** Vi phạm theo luật chặn của thẻ (BR-06, BR-07). Trả về lý do hoặc null. */
export function viPham(t: TheInput, homNay: string): LyDo | null {
  const hetLuot = t.soLuotConLai != null && t.soLuotConLai <= 0;
  const hh = hetHanHieuLuc(t, homNay);
  const hetHan = hh != null && homNay > hh;
  switch (t.luatChan) {
    case "CHI_HET_LUOT":
      return hetLuot ? "HET_LUOT" : null;
    case "CHI_HET_HAN":
      return hetHan ? "HET_HAN" : null;
    default:
      if (hetLuot && hetHan) return "HET_LUOT_VA_HET_HAN";
      if (hetLuot) return "HET_LUOT";
      if (hetHan) return "HET_HAN";
      return null;
  }
}

/** Thứ tự chọn thẻ BR-03: hết hạn sớm nhất trước, cùng hạn thì mua trước. */
export function sapXepThe<T extends TheInput>(cards: T[], homNay: string): T[] {
  return [...cards].sort((a, b) => {
    const ha = hetHanHieuLuc(a, homNay) ?? VO_HAN;
    const hb = hetHanHieuLuc(b, homNay) ?? VO_HAN;
    if (ha !== hb) return ha < hb ? -1 : 1;
    if (a.ngayMua !== b.ngayMua) return a.ngayMua < b.ngayMua ? -1 : 1;
    return a.id - b.id;
  });
}

/** Thẻ còn dùng được (không huỷ, không vi phạm luật) — dùng cho BR-13 "đã có thẻ mới". */
export function theConHieuLuc(t: TheInput, homNay: string): boolean {
  return t.trangThai !== "HUY" && viPham(t, homNay) == null;
}

/** Trạng thái hiển thị của thẻ. */
export function trangThaiThe(t: TheInput, homNay: string): string {
  if (t.trangThai === "HUY") return "HUY";
  if (dangBaoLuu(t, homNay)) return "BAO_LUU";
  const v = viPham(t, homNay);
  if (v === "HET_HAN" || v === "HET_LUOT_VA_HET_HAN") return "HET_HAN";
  if (v === "HET_LUOT") return "HET_LUOT";
  if (t.mocTinhHan === "LAN_DAU_CHECKIN" && !t.ngayKichHoat && t.hanDungNgay != null) return "CHUA_KICH_HOAT";
  return "HOAT_DONG";
}

/** Thông tin sắp hết theo BR-12 sau khi trừ. */
export function tinhSapHet(
  t: Pick<TheInput, "nguongCanhBaoLuot" | "nguongCanhBaoNgay">,
  conLuot: number | null,
  ngayHetHan: string | null,
  homNay: string,
): KetQuaEngine["sapHet"] {
  const conNgay = ngayHetHan ? soNgayGiua(homNay, ngayHetHan) : null;
  const sapHetLuot = conLuot != null && conLuot <= t.nguongCanhBaoLuot;
  const sapHetNgay = conNgay != null && conNgay <= t.nguongCanhBaoNgay;
  if (!sapHetLuot && !sapHetNgay) return null;
  return { conLuot, ngayHetHan, conNgay };
}

type TrangThaiXet = "OK" | "LIMIT" | "CANH_BAO" | "UNPAID" | "BAO_LUU" | "CHAN";

export function quyetDinhCheckIn(input: {
  homNay: string;
  coSoId: number;
  khach: KhachInput;
  cacThe: TheInput[];
}): KetQuaEngine {
  const { homNay, coSoId, khach } = input;
  const base: KetQuaEngine = {
    ketQua: "BI_CHAN",
    mau: "DO",
    lyDo: null,
    the: null,
    truLuot: false,
    soLuotConSau: null,
    kichHoat: null,
    ngayHetHan: null,
    sapHet: null,
    lanCheckinTruoc: null,
    baoLuuDen: null,
  };

  // BR-23: khách tự đăng ký chưa duyệt
  if (khach.trangThai === "CHO_DUYET") return { ...base, mau: "VANG", lyDo: "CHO_DUYET" };
  if (khach.trangThai !== "HOAT_DONG") return { ...base, lyDo: "KHACH_NGUNG" };

  const cards = input.cacThe.filter((t) => t.trangThai !== "HUY");
  if (cards.length === 0) return { ...base, lyDo: "KHONG_CO_THE" };

  // BR-10: chỉ xét thẻ dùng được tại cơ sở này
  const atCoSo = cards.filter((t) => dungDuocTaiCoSo(t, coSoId));
  if (atCoSo.length === 0) return { ...base, lyDo: "SAI_CO_SO" };

  const xet = sapXepThe(atCoSo, homNay).map((t) => {
    let st: TrangThaiXet;
    const v = viPham(t, homNay);
    if (dangBaoLuu(t, homNay)) st = "BAO_LUU";
    else if (v && t.hanhDongKhiViPham !== "CANH_BAO") st = "CHAN";
    else if (!t.daDatThanhToan) st = "UNPAID";
    else if (t.soLuotTruHomNay >= t.toiDaLuotMoiNgay) st = "LIMIT";
    else if (v) st = "CANH_BAO";
    else st = "OK";
    return { t, st, v };
  });

  const tim = (st: TrangThaiXet) => xet.find((x) => x.st === st);

  const ok = tim("OK");
  if (ok) {
    const t = ok.t;
    const truLuot = t.soLuotConLai != null;
    const conSau = truLuot ? (t.soLuotConLai as number) - 1 : null;
    let kichHoat: KetQuaEngine["kichHoat"] = null;
    let hh = t.ngayHetHan;
    if (t.mocTinhHan === "LAN_DAU_CHECKIN" && !t.ngayKichHoat) {
      hh = t.hanDungNgay != null ? congNgay(homNay, t.hanDungNgay - 1 + (t.soNgayDaBaoLuu ?? 0)) : null;
      kichHoat = { ngayKichHoat: homNay, ngayHetHan: hh };
    }
    // BR-13: khách đã có thẻ khác còn hiệu lực thì không cảnh báo sắp hết
    const coTheKhac = cards.some((c) => c.id !== t.id && theConHieuLuc(c, homNay));
    const sapHet = coTheKhac ? null : tinhSapHet(t, conSau, hh, homNay);
    return { ...base, ketQua: "HOP_LE", mau: "XANH", the: t, truLuot, soLuotConSau: conSau, kichHoat, ngayHetHan: hh, sapHet };
  }

  const limit = tim("LIMIT");
  if (limit) {
    const lan = xet
      .map((x) => x.t.lanCuoiHomNay)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      ...base,
      ketQua: "DA_CHECKIN",
      mau: "VANG",
      lyDo: "DA_CHECKIN_HOM_NAY",
      the: limit.t,
      soLuotConSau: limit.t.soLuotConLai,
      ngayHetHan: hetHanHieuLuc(limit.t, homNay),
      lanCheckinTruoc: lan ?? null,
    };
  }

  const cb = tim("CANH_BAO");
  if (cb) {
    // BR-08: vẫn cho vào, vẫn trừ lượt; hết lượt thì thành số âm (nợ lượt)
    const t = cb.t;
    const truLuot = t.soLuotConLai != null;
    const conSau = truLuot ? (t.soLuotConLai as number) - 1 : null;
    return {
      ...base,
      ketQua: "CANH_BAO",
      mau: "VANG",
      lyDo: cb.v,
      the: t,
      truLuot,
      soLuotConSau: conSau,
      ngayHetHan: hetHanHieuLuc(t, homNay),
    };
  }

  const unpaid = tim("UNPAID");
  if (unpaid) return { ...base, mau: "VANG", lyDo: "CHUA_THANH_TOAN", the: unpaid.t, soLuotConSau: unpaid.t.soLuotConLai };

  const bl = tim("BAO_LUU");
  if (bl) return { ...base, lyDo: "BAO_LUU", the: bl.t, soLuotConSau: bl.t.soLuotConLai, baoLuuDen: bl.t.baoLuuDen };

  const chan = xet[0];
  return {
    ...base,
    lyDo: chan.v ?? "HET_LUOT",
    the: chan.t,
    soLuotConSau: chan.t.soLuotConLai,
    ngayHetHan: hetHanHieuLuc(chan.t, homNay),
  };
}

/** BR-19: thẻ có được dùng theo tình trạng thanh toán của đơn. */
export function datDieuKienThanhToan(
  cauHinh: CauHinhThanhToan | string,
  don: { giaThucThu: number; daThu: number; conNo: number } | null,
): boolean {
  if (!don || don.giaThucThu <= 0) return true;
  if (cauHinh === "NGAY_KHI_TAO") return true;
  if (cauHinh === "DA_THU_DU") return don.conNo <= 0;
  return don.daThu > 0; // DA_COC
}

/** Câu thông báo (tiếng Việt) theo lý do — dùng cho trang quản lý. */
export const LY_DO_TEXT: Record<LyDo, string> = {
  CHO_DUYET: "Hồ sơ chờ duyệt, mời gặp lễ tân",
  KHACH_NGUNG: "Hồ sơ đã ngừng hoạt động",
  KHONG_CO_THE: "Chưa có thẻ vé",
  SAI_CO_SO: "Thẻ không dùng được ở cơ sở này",
  BAO_LUU: "Thẻ đang bảo lưu",
  CHUA_THANH_TOAN: "Thẻ chưa đủ điều kiện thanh toán, mời gặp lễ tân",
  DA_CHECKIN_HOM_NAY: "Đã check-in hôm nay",
  HET_LUOT: "Thẻ đã hết lượt",
  HET_HAN: "Thẻ đã hết hạn",
  HET_LUOT_VA_HET_HAN: "Thẻ đã hết lượt và hết hạn",
};
