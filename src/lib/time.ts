// Mọi phép tính ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè) — NFR-13.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày VN dạng YYYY-MM-DD của một thời điểm. */
export function ngayVN(d: Date = new Date()): string {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Cộng n ngày vào chuỗi YYYY-MM-DD. */
export function congNgay(ngay: string, n: number): string {
  const d = new Date(ngay + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Số ngày từ a đến b (b - a). */
export function soNgayGiua(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

function parts(d: Date) {
  const v = new Date(d.getTime() + VN_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    dd: p(v.getUTCDate()),
    mm: p(v.getUTCMonth() + 1),
    yyyy: String(v.getUTCFullYear()),
    hh: p(v.getUTCHours()),
    mi: p(v.getUTCMinutes()),
    ss: p(v.getUTCSeconds()),
  };
}

export function fmtNgayGio(d: Date | string | null | undefined): string {
  if (!d) return "";
  const x = parts(new Date(d));
  return `${x.dd}/${x.mm}/${x.yyyy} ${x.hh}:${x.mi}`;
}

export function fmtGio(d: Date | string | null | undefined): string {
  if (!d) return "";
  const x = parts(new Date(d));
  return `${x.hh}:${x.mi}`;
}

/** Ngày YYYY-MM-DD -> dd/mm/yyyy. */
export function fmtNgay(ngay: string | null | undefined): string {
  if (!ngay) return "";
  const [y, m, d] = ngay.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Tuổi tròn tại ngày `homNay` (YYYY-MM-DD). */
export function tinhTuoi(ngaySinh: string, homNay: string = ngayVN()): number {
  const [y1, m1, d1] = ngaySinh.split("-").map(Number);
  const [y2, m2, d2] = homNay.split("-").map(Number);
  let t = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) t--;
  return t;
}

/** Đầu ngày VN dưới dạng Date UTC. */
export function dauNgayVN(ngay: string): Date {
  return new Date(Date.parse(ngay + "T00:00:00Z") - VN_OFFSET_MS);
}

/** Giờ VN (0-23) của thời điểm. */
export function gioVN(d: Date): number {
  return new Date(d.getTime() + VN_OFFSET_MS).getUTCHours();
}

/** Thứ trong tuần theo VN: 0=CN..6=T7. */
export function thuVN(d: Date): number {
  return new Date(d.getTime() + VN_OFFSET_MS).getUTCDay();
}

/** Ngày YYYY-MM-DD có tồn tại thật không (loại 31/02, tháng 13…). */
export function ngayHopLe(s: string | null | undefined): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
