/** Bỏ dấu tiếng Việt, chữ thường — dùng cho tìm kiếm không dấu (FR-KH-02). */
export function khongDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function chuoiTimKiem(...parts: (string | null | undefined)[]): string {
  return khongDau(parts.filter(Boolean).join(" "));
}

/** Chỉ giữ chữ số của SĐT. */
export function chuanSdt(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * Che tên trên trang khách (NFR-07): "Nguyễn Minh Anh" -> "Ng**** Minh A."
 * Giữ 2 ký tự đầu của họ, giữ tên đệm cuối, tên chỉ còn chữ cái đầu.
 */
export function cheTen(hoTen: string): string {
  const parts = hoTen.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1) + "***";
  const ho = parts[0];
  const ten = parts[parts.length - 1];
  const dem = parts.length > 2 ? parts[parts.length - 2] : "";
  const hoChe = ho.slice(0, 2) + "*".repeat(Math.max(2, ho.length - 2));
  return [hoChe, dem, ten.slice(0, 1) + "."].filter(Boolean).join(" ");
}

/** Che SĐT: 0901234567 -> 0901 *** 567 */
export function cheSdt(sdt: string | null | undefined): string {
  const d = chuanSdt(sdt);
  if (d.length < 7) return d ? "***" : "";
  return `${d.slice(0, 4)} *** ${d.slice(-3)}`;
}

export function fmtTien(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("vi-VN") + "đ";
}

const ALPHABET_XN = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Mã xác nhận 4 ký tự dễ đọc (BR-14). */
export function maXacNhan(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => ALPHABET_XN[b % ALPHABET_XN.length]).join("");
}

/** Token ngẫu nhiên an toàn (QR cá nhân, QR lớp/quầy). */
export function tokenNgauNhien(len = 22): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  const a = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(bytes, (b) => a[b % a.length]).join("");
}
