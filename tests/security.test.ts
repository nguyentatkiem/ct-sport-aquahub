// Kiểm thử bảo mật: ẩn danh hoá NFR-08, lỗi nghiệp vụ an toàn, phân quyền vai trò.
import { describe, it, expect, beforeEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { khachHang, theVe, nhatKy } from "@/db/schema";
import { resetDb, seedCoBan } from "./helpers";
import { taoKhach, anDanhHoaKhach, timKhachTrung } from "@/server/customers";
import { banTheVe } from "@/server/sales";
import { thucHienCheckIn } from "@/server/checkin";
import { LoiNghiepVu } from "@/server/errors";
import { traCuuKhach } from "@/server/guest";
import { co } from "@/lib/permissions";

let S: Awaited<ReturnType<typeof seedCoBan>>;
beforeEach(async () => {
  await resetDb();
  S = await seedCoBan();
});

describe("NFR-08 xoá dữ liệu cá nhân", () => {
  it("chỉ Chủ được ẩn danh; giữ thẻ, xoá thông tin cá nhân và người liên hệ không còn dùng", async () => {
    const k = await taoKhach({ hoTen: "Phạm Bảo Châu", ngaySinh: "2017-02-02", lienHe: { hoTen: "Phạm Văn Dũng", sdt: "0933111222", quanHe: "BO" }, coSoId: S.cs1.id, ghiChuSucKhoe: "Hen suyễn" }, { nguonTao: "NV_NHAP", user: S.ltLT });
    const { the } = await banTheVe({ khachHangId: k.id, sanPhamId: S.ve10.id, coSoId: S.cs1.id, giaThucThu: 500000, user: S.ltLT });
    await expect(anDanhHoaKhach(k.id, "Khách yêu cầu", S.qlLT)).rejects.toThrow(/Chủ/);
    await anDanhHoaKhach(k.id, "Khách yêu cầu ngày 10/10", S.chu);
    const [x] = await db.select().from(khachHang).where(eq(khachHang.id, k.id));
    expect(x).toMatchObject({ hoTen: "Khách đã xoá dữ liệu", sdt: null, nguoiLienHeId: null, ghiChuSucKhoe: null, trangThai: "NGUNG" });
    expect(x.qrToken).not.toBe(k.qrToken);
    expect(x.timKiem).not.toContain("pham");
    const [n] = (await db.execute(sql`select count(*)::int as n from nguoi_lien_he`)).rows as { n: number }[];
    expect(n.n).toBe(0);
    expect((await db.select().from(theVe).where(eq(theVe.id, the.id)))[0].khachHangId).toBe(k.id);
    expect((await traCuuKhach("0933111222")).buoc).toBe("khong_thay");
    expect(await timKhachTrung({ hoTen: "Phạm Bảo Châu", ngaySinh: "2017-02-02", sdtLienHe: "0933111222" })).toHaveLength(0);
    const log = await db.select().from(nhatKy).where(eq(nhatKy.hanhDong, "AN_DANH_HOA"));
    expect(log).toHaveLength(1);
  });
});

describe("Lỗi an toàn và ma trận quyền", () => {
  it("lỗi nghiệp vụ của check-in là LoiNghiepVu (được phép hiện cho người dùng)", async () => {
    await expect(thucHienCheckIn({ khachHangId: 999999, coSoId: S.cs1.id, kenh: "LE_TAN" })).rejects.toBeInstanceOf(LoiNghiepVu);
  });

  it("ma trận quyền mục 3.1", () => {
    expect(co("LE_TAN", "VUOT_CHAN")).toBe(false);
    expect(co("LE_TAN", "XEM_DOANH_THU")).toBe(false);
    expect(co("LE_TAN", "XUAT_EXCEL")).toBe(false);
    expect(co("LE_TAN", "DIEU_CHINH_THE")).toBe(false);
    expect(co("QUAN_LY", "SUA_SAN_PHAM")).toBe(false);
    expect(co("QUAN_LY", "QUAN_LY_TAI_KHOAN")).toBe(false);
    expect(co("QUAN_LY", "XEM_NHAT_KY")).toBe(false);
    expect(co("QUAN_LY", "HUY_PHIEU")).toBe(true);
    expect(co("QUAN_LY", "VUOT_CHAN")).toBe(true);
    expect(co("CHU", "CAI_DAT")).toBe(true);
    expect(co(null, "XEM_BAO_CAO")).toBe(false);
  });
});
