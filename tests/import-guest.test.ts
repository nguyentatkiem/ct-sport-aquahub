// FR-HT-06 (nhập Excel, không nhập nửa chừng) và FR-CI-02/NFR-07 (tra cứu khách che thông tin).
import { describe, it, expect, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { sanPham } from "@/db/schema";
import { resetDb, seedCoBan } from "./helpers";
import { docVaKiemTra, nhapKhach, COT_MAU } from "@/server/import";
import { traCuuKhach, giaiTokenKhach } from "@/server/guest";
import { taoKhach } from "@/server/customers";
import { cheTen, cheSdt, khongDau } from "@/lib/text";

let S: Awaited<ReturnType<typeof seedCoBan>>;

async function file(rows: (string | number | null)[][]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Khách");
  ws.addRow(COT_MAU);
  rows.forEach((r) => ws.addRow(r));
  const b = await wb.xlsx.writeBuffer();
  return b instanceof ArrayBuffer ? b : new Uint8Array(b as ArrayLike<number>).buffer;
}

beforeEach(async () => {
  await resetDb();
  S = await seedCoBan();
  await db.insert(sanPham).values({ loai: "THE_VE", ten: "Thẻ chuyển đổi", giaNiemYet: 0, laTheChuyenDoi: true });
});

describe("Nhập Excel", () => {
  it("báo đúng dòng lỗi và không nhập gì khi còn lỗi", async () => {
    const buf = await file([
      ["Nguyễn Minh Anh", "15/03/2016", "", "Trần Thị Hoa", "0912345678", "Mẹ", "LT", "", 7, "31/12/2026"],
      ["Bé Thiếu Phụ Huynh", "01/01/2018", "", "", "", "", "LT", "", "", ""],
      ["Người Lớn", "2/9/1985", "0987654321", "", "", "", "XX", "", "", ""],
      ["Sai Ngày", "31-13-2000", "0987000000", "", "", "", "LT", "", "", ""],
    ]);
    const kt = await docVaKiemTra(buf, S.chu);
    expect(kt.hopLe).toHaveLength(1);
    expect(kt.loi.map((l) => l.dong)).toEqual([3, 4, 5]);
    expect(kt.loi[0].loi).toMatch(/phụ huynh/);
    expect(kt.loi[1].loi).toMatch(/XX/);
    await expect(nhapKhach(buf, S.chu, true)).rejects.toThrow(/dòng lỗi/);
    const [n] = (await db.execute(sql`select count(*)::int as n from khach_hang`)).rows as { n: number }[];
    expect(n.n).toBe(0);
  });

  it("nhập cả file trong 1 giao dịch, tạo thẻ chuyển đổi, bỏ qua dòng trùng", async () => {
    await taoKhach({ hoTen: "Lê Văn Bình", ngaySinh: "1985-09-02", sdt: "0987654321", coSoId: S.cs1.id }, { nguonTao: "NV_NHAP", user: S.chu });
    const buf = await file([
      ["Nguyễn Minh Anh", "15/03/2016", "", "Trần Thị Hoa", "0912345678", "Mẹ", "LT", "Sổ cũ", 7, "31/12/2026"],
      ["Lê Văn Bình", "02/09/1985", "0987654321", "", "", "", "LT", "", "", ""],
    ]);
    const kt = await docVaKiemTra(buf, S.chu);
    expect(kt.trung).toHaveLength(1);
    const r = await nhapKhach(buf, S.chu, true);
    expect(r).toEqual({ soKhach: 1, soThe: 1, boQua: 1 });
    const the = (await db.execute(sql`select so_luot_con_lai, ngay_het_han::text as h, la_chuyen_doi from the_ve`)).rows[0] as Record<string, unknown>;
    expect(the).toMatchObject({ so_luot_con_lai: 7, h: "2026-12-31", la_chuyen_doi: true });
  });

  it("quản lý chỉ nhập được cho cơ sở mình", async () => {
    const buf = await file([["Khách CG", "01/01/1990", "0901112223", "", "", "", "CG", "", "", ""]]);
    const kt = await docVaKiemTra(buf, S.qlLT);
    expect(kt.loi[0].loi).toMatch(/cơ sở của bạn/);
  });
});

describe("Trang khách: tra cứu và che thông tin", () => {
  it("SĐT phụ huynh 2 con trả 2 tên đã che; mã khách cần 4 số cuối", async () => {
    const a = await taoKhach({ hoTen: "Nguyễn Minh Anh", ngaySinh: "2016-01-01", lienHe: { hoTen: "Mẹ", sdt: "0912345678", quanHe: "ME" }, coSoId: S.cs1.id }, { nguonTao: "NV_NHAP", user: S.chu });
    await taoKhach({ hoTen: "Nguyễn Minh Bảo", ngaySinh: "2018-01-01", lienHe: { hoTen: "Mẹ", sdt: "0912345678", quanHe: "ME" }, coSoId: S.cs1.id }, { nguonTao: "NV_NHAP", user: S.chu });
    const r = await traCuuKhach("0912 345 678");
    expect(r.buoc).toBe("chon");
    if (r.buoc !== "chon") return;
    expect(r.ungVien.map((u) => u.tenChe)).toEqual(["Ng**** Minh A.", "Ng**** Minh B."]);
    expect(JSON.stringify(r)).not.toContain("Nguyễn");
    expect(await giaiTokenKhach(r.ungVien[0].tok)).toBe(a.id);
    expect((await traCuuKhach(a.maKh)).buoc).toBe("can_4_so");
    expect((await traCuuKhach(a.maKh, "1111")).buoc).toBe("sai_4_so");
    expect((await traCuuKhach(a.maKh.toLowerCase(), "5678")).buoc).toBe("chon");
    expect((await traCuuKhach("0900000000")).buoc).toBe("khong_thay");
  });

  it("che tên, che SĐT, bỏ dấu", () => {
    expect(cheTen("Nguyễn Minh Anh")).toBe("Ng**** Minh A.");
    expect(cheTen("Lê An")).toBe("Lê** A.");
    expect(cheSdt("0912345678")).toBe("0912 *** 678");
    expect(khongDau("Nguyễn Đức Thắng")).toBe("nguyen duc thang");
  });
});
