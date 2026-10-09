// Ma trận quyền (mục 3.1). Dùng được cả ở máy chủ và giao diện; kiểm tra thật luôn ở máy chủ.
export type VaiTro = "CHU" | "QUAN_LY" | "LE_TAN";

export type Quyen =
  | "XOA_KHACH"
  | "HUY_PHIEU"
  | "DIEU_CHINH_THE"
  | "VUOT_CHAN"
  | "XEM_DOANH_THU"
  | "XEM_BAO_CAO"
  | "XUAT_EXCEL"
  | "SUA_SAN_PHAM"
  | "QUAN_LY_LOP_GV_QR"
  | "QUAN_LY_TAI_KHOAN"
  | "XEM_NHAT_KY"
  | "CAI_DAT"
  | "NHAP_EXCEL"
  | "XAC_NHAN_TOT_NGHIEP";

const MA_TRAN: Record<Quyen, VaiTro[]> = {
  XOA_KHACH: ["CHU"],
  HUY_PHIEU: ["CHU", "QUAN_LY"],
  DIEU_CHINH_THE: ["CHU", "QUAN_LY"],
  VUOT_CHAN: ["CHU", "QUAN_LY"],
  XEM_DOANH_THU: ["CHU", "QUAN_LY"],
  XEM_BAO_CAO: ["CHU", "QUAN_LY"],
  XUAT_EXCEL: ["CHU", "QUAN_LY"],
  SUA_SAN_PHAM: ["CHU"],
  QUAN_LY_LOP_GV_QR: ["CHU", "QUAN_LY"],
  QUAN_LY_TAI_KHOAN: ["CHU"],
  XEM_NHAT_KY: ["CHU"],
  CAI_DAT: ["CHU"],
  NHAP_EXCEL: ["CHU", "QUAN_LY"],
  XAC_NHAN_TOT_NGHIEP: ["CHU", "QUAN_LY"],
};

export function co(vaiTro: string | undefined | null, q: Quyen): boolean {
  return !!vaiTro && (MA_TRAN[q] as string[]).includes(vaiTro);
}
