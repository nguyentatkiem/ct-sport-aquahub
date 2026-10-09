// FR-SP-03: mô tả luật sản phẩm bằng câu chữ để admin đọc hiểu trước khi lưu.
type Sp = {
  loai: string;
  soLuot?: number | null;
  hanDungNgay?: number | null;
  mocTinhHan?: string | null;
  luatChan?: string | null;
  hanhDongKhiViPham?: string | null;
  dungLienCoSo?: boolean | null;
  toiDaLuotMoiNgay?: number | null;
  nguongCanhBaoLuot?: number | null;
  nguongCanhBaoNgay?: number | null;
  choBaoLuu?: boolean | null;
  baoLuuToiDaNgay?: number | null;
  soBuoiHoc?: number | null;
  soBuoiTotNghiep?: number | null;
  laTheChuyenDoi?: boolean | null;
};

export function moTaLuat(s: Sp): string {
  if (s.loai === "KHOA_HOC") {
    const parts = [`Khoá ${s.soBuoiHoc ?? "?"} buổi`, `tốt nghiệp khi đủ ${s.soBuoiTotNghiep ?? s.soBuoiHoc ?? "?"} buổi (đếm khi quét QR lớp)`];
    parts.push("không trừ lượt và không chặn vào cửa");
    if (s.choBaoLuu) parts.push(`cho bảo lưu tối đa ${s.baoLuuToiDaNgay ?? 0} ngày`);
    return parts.join(", ") + ".";
  }
  if (s.laTheChuyenDoi) return "Thẻ chuyển đổi từ thẻ giấy: số lượt và hạn nhập theo từng thẻ, giá 0đ, không tính doanh số.";
  const luot = s.soLuot == null ? "không giới hạn lượt" : `${s.soLuot} lượt`;
  const han = s.hanDungNgay == null ? "không hạn dùng" : `hạn ${s.hanDungNgay} ngày tính từ ${s.mocTinhHan === "LAN_DAU_CHECKIN" ? "lần check-in đầu tiên" : "ngày mua"}`;
  const khi =
    s.luatChan === "CHI_HET_LUOT" ? "khi hết lượt" : s.luatChan === "CHI_HET_HAN" ? "khi hết hạn" : "khi hết lượt hoặc hết hạn (cái nào đến trước)";
  const hd = s.hanhDongKhiViPham === "CANH_BAO" ? `cảnh báo nhưng vẫn cho vào ${khi} (lượt có thể âm)` : `chặn ${khi}`;
  const parts = [`Thẻ ${luot}, ${han}, ${hd}`];
  parts.push(`tối đa ${s.toiDaLuotMoiNgay ?? 1} lượt/ngày`);
  parts.push(s.dungLienCoSo ? "dùng được ở các cơ sở áp dụng" : "chỉ dùng ở cơ sở bán");
  parts.push(`báo sắp hết khi còn ≤ ${s.nguongCanhBaoLuot ?? 3} lượt hoặc ≤ ${s.nguongCanhBaoNgay ?? 7} ngày`);
  if (s.choBaoLuu) parts.push(`cho bảo lưu tối đa ${s.baoLuuToiDaNgay ?? 0} ngày`);
  return parts.join(", ") + ".";
}
