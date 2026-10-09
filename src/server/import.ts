// FR-HT-06: nhập khách cũ và thẻ cũ từ file Excel mẫu. Báo dòng lỗi cụ thể, không nhập nửa chừng.
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coSo, sanPham } from "@/db/schema";
import { kiemTraDuLieuKhach, taoKhach, timKhachTrung, type DuLieuKhach } from "./customers";
import { taoTheChuyenDoiTx, LoiNghiepVu } from "./sales";
import { ghiNhatKy } from "./audit";
import { ngayHopLe, ngayVN } from "@/lib/time";
import type { NguoiDungPhien } from "./auth";

export const COT_MAU = [
  "Họ tên*",
  "Ngày sinh* (dd/mm/yyyy)",
  "SĐT khách",
  "Tên phụ huynh/liên hệ",
  "SĐT phụ huynh/liên hệ",
  "Quan hệ (Bố/Mẹ/Ông/Bà/Khác)",
  "Mã cơ sở* (VD LT)",
  "Ghi chú",
  "Số lượt thẻ cũ còn lại",
  "Hạn thẻ cũ (dd/mm/yyyy)",
];

const QH: Record<string, string> = { "bố": "BO", "bo": "BO", "mẹ": "ME", "me": "ME", "ông": "ONG", "ong": "ONG", "bà": "BA", "ba": "BA", "khác": "KHAC", "khac": "KHAC" };

function oNgay(v: ExcelJS.CellValue): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return new Date(v.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  const s = String(typeof v === "object" && "text" in v ? v.text : v).trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s;
  return ngayHopLe(iso) ? iso : "SAI";
}
function oChu(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v) return String(v.text).trim();
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim();
  return String(v).trim();
}

export type DongNhap = { dong: number; d: DuLieuKhach; soLuot: number | null; hanThe: string | null; hoTen: string };
export type KetQuaKiemTra = { loi: { dong: number; loi: string }[]; hopLe: DongNhap[]; trung: { dong: number; ma: string }[] };

export async function docVaKiemTra(buf: ArrayBuffer, user: NguoiDungPhien): Promise<KetQuaKiemTra> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf);
  } catch {
    throw new LoiNghiepVu("Không đọc được file. Dùng đúng file Excel mẫu (.xlsx).");
  }
  const ws = wb.worksheets[0];
  if (!ws) throw new LoiNghiepVu("File không có sheet nào");
  const css = await db.select().from(coSo);
  const loi: KetQuaKiemTra["loi"] = [];
  const hopLe: DongNhap[] = [];
  const trung: KetQuaKiemTra["trung"] = [];
  const homNay = ngayVN();
  const seen = new Set<string>();
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const v = (i: number) => row.getCell(i).value;
    if ([1, 2, 7].every((i) => !oChu(v(i)))) continue;
    const loiDong: string[] = [];
    const ns = oNgay(v(2));
    if (!ns || ns === "SAI") loiDong.push("Ngày sinh sai định dạng dd/mm/yyyy");
    const ma = oChu(v(7)).toUpperCase();
    const cs = css.find((c) => c.ma === ma);
    if (!cs) loiDong.push(`Mã cơ sở "${ma}" không tồn tại`);
    else if (user.vaiTro !== "CHU" && cs.id !== user.coSoId) loiDong.push("Chỉ được nhập khách cho cơ sở của bạn");
    const qh = QH[oChu(v(6)).toLowerCase()] ?? "KHAC";
    const lhTen = oChu(v(4));
    const lhSdt = oChu(v(5));
    const d: DuLieuKhach = {
      hoTen: oChu(v(1)),
      ngaySinh: ns && ns !== "SAI" ? ns : "",
      sdt: oChu(v(3)) || null,
      lienHe: lhTen || lhSdt ? { hoTen: lhTen, sdt: lhSdt, quanHe: qh } : null,
      coSoId: cs?.id ?? 0,
      ghiChu: oChu(v(8)) || null,
    };
    if (!loiDong.length) {
      try {
        kiemTraDuLieuKhach(d, homNay);
      } catch (e) {
        loiDong.push((e as Error).message);
      }
    }
    const slRaw = oChu(v(9));
    const soLuot = slRaw ? Number(slRaw) : null;
    if (slRaw && (!Number.isInteger(soLuot) || (soLuot as number) < 0)) loiDong.push("Số lượt thẻ cũ phải là số nguyên ≥ 0");
    const han = oNgay(v(10));
    if (han === "SAI") loiDong.push("Hạn thẻ cũ sai định dạng");
    if (han && han !== "SAI" && !slRaw) loiDong.push("Có hạn thẻ cũ nhưng thiếu số lượt");
    const khoa = `${d.hoTen.toLowerCase()}|${d.ngaySinh}|${d.sdt ?? d.lienHe?.sdt ?? ""}`;
    if (seen.has(khoa)) loiDong.push("Trùng với một dòng khác trong file");
    seen.add(khoa);
    if (loiDong.length) {
      loi.push({ dong: r, loi: loiDong.join("; ") });
      continue;
    }
    const tr = await timKhachTrung({ hoTen: d.hoTen, ngaySinh: d.ngaySinh, sdt: d.sdt, sdtLienHe: d.lienHe?.sdt });
    if (tr.length) trung.push({ dong: r, ma: tr.map((t) => t.maKh).join(", ") });
    hopLe.push({ dong: r, d, soLuot, hanThe: han && han !== "SAI" ? han : null, hoTen: d.hoTen });
  }
  if (!hopLe.length && !loi.length) throw new LoiNghiepVu("File không có dòng dữ liệu");
  return { loi, hopLe, trung };
}

export async function nhapKhach(buf: ArrayBuffer, user: NguoiDungPhien, boQuaTrung: boolean) {
  const kt = await docVaKiemTra(buf, user);
  if (kt.loi.length) throw new LoiNghiepVu(`File còn ${kt.loi.length} dòng lỗi. Sửa hết rồi nhập lại (không nhập nửa chừng).`);
  const [cd] = await db.select().from(sanPham).where(eq(sanPham.laTheChuyenDoi, true)).limit(1);
  if (kt.hopLe.some((x) => x.soLuot != null) && !cd) throw new LoiNghiepVu("Chưa có sản phẩm Thẻ chuyển đổi: tạo trong Sản phẩm trước");
  const boQua = new Set(boQuaTrung ? kt.trung.map((t) => t.dong) : []);
  const homNay = ngayVN();
  let soKhach = 0;
  let soThe = 0;
  await db.transaction(async (tx) => {
    for (const x of kt.hopLe) {
      if (boQua.has(x.dong)) continue;
      const k = await taoKhach(x.d, { nguonTao: "NHAP_EXCEL", user, tx });
      soKhach++;
      if (x.soLuot != null) {
        await taoTheChuyenDoiTx(tx, { khachHangId: k.id, coSoId: x.d.coSoId, sanPhamId: cd!.id, soLuot: x.soLuot, ngayHetHan: x.hanThe, user, ngay: homNay });
        soThe++;
      }
    }
    await ghiNhatKy(tx, user, { module: "Nhập dữ liệu", hanhDong: "NHAP_EXCEL", giaTriMoi: { soKhach, soThe, boQuaTrung: boQua.size } });
  });
  return { soKhach, soThe, boQua: boQua.size };
}
