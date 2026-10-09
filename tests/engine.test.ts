// Ca kiểm thử mục 11.3 ở mức luật thuần (không CSDL).
import { describe, it, expect } from "vitest";
import { quyetDinhCheckIn, type TheInput, datDieuKienThanhToan, trangThaiThe } from "@/lib/checkin-engine";

const HOM_NAY = "2026-10-08";

function the(p: Partial<TheInput> = {}): TheInput {
  return {
    id: 1,
    tenSanPham: "Vé 10 buổi",
    coSoBanId: 1,
    soLuotGoc: 10,
    soLuotConLai: 10,
    hanDungNgay: 90,
    mocTinhHan: "NGAY_MUA",
    luatChan: "HET_LUOT_HOAC_HET_HAN",
    hanhDongKhiViPham: "CHAN",
    dungLienCoSo: false,
    coSoApDung: null,
    toiDaLuotMoiNgay: 1,
    nguongCanhBaoLuot: 3,
    nguongCanhBaoNgay: 7,
    ngayMua: "2026-09-01",
    ngayKichHoat: null,
    ngayHetHan: "2026-11-29",
    soNgayDaBaoLuu: 0,
    baoLuuTu: null,
    baoLuuDen: null,
    trangThai: "HOAT_DONG",
    daDatThanhToan: true,
    soLuotTruHomNay: 0,
    lanCuoiHomNay: null,
    ...p,
  };
}

const run = (cacThe: TheInput[], coSoId = 1, trangThai = "HOAT_DONG") =>
  quyetDinhCheckIn({ homNay: HOM_NAY, coSoId, khach: { trangThai }, cacThe });

describe("Lõi check-in theo bộ ca 11.3", () => {
  it("TC-01: thẻ 10 lượt còn 4 → xanh, còn 3, cảnh báo sắp hết", () => {
    const r = run([the({ soLuotConLai: 4 })]);
    expect(r.ketQua).toBe("HOP_LE");
    expect(r.mau).toBe("XANH");
    expect(r.truLuot).toBe(true);
    expect(r.soLuotConSau).toBe(3);
    expect(r.sapHet?.conLuot).toBe(3);
  });

  it("TC-02: còn 0 lượt, luật CHAN → đỏ, không trừ", () => {
    const r = run([the({ soLuotConLai: 0 })]);
    expect(r.ketQua).toBe("BI_CHAN");
    expect(r.mau).toBe("DO");
    expect(r.truLuot).toBe(false);
    expect(r.lyDo).toBe("HET_LUOT");
  });

  it("TC-03: còn 0 lượt, luật CANH_BAO → vàng, cho vào, còn -1", () => {
    const r = run([the({ soLuotConLai: 0, hanhDongKhiViPham: "CANH_BAO" })]);
    expect(r.ketQua).toBe("CANH_BAO");
    expect(r.mau).toBe("VANG");
    expect(r.truLuot).toBe(true);
    expect(r.soLuotConSau).toBe(-1);
  });

  it("TC-04: 31 lượt còn 10, quá hạn 1 ngày, HET_LUOT_HOAC_HET_HAN → đỏ hết hạn", () => {
    const r = run([the({ soLuotGoc: 31, soLuotConLai: 10, ngayHetHan: "2026-10-07" })]);
    expect(r.mau).toBe("DO");
    expect(r.lyDo).toBe("HET_HAN");
  });

  it("TC-05: như TC-04 nhưng CHI_HET_LUOT → xanh, còn 9", () => {
    const r = run([the({ soLuotGoc: 31, soLuotConLai: 10, ngayHetHan: "2026-10-07", luatChan: "CHI_HET_LUOT" })]);
    expect(r.ketQua).toBe("HOP_LE");
    expect(r.soLuotConSau).toBe(9);
  });

  it("Hết hạn tính sau 23:59 của ngày hết hạn (BR-06)", () => {
    expect(run([the({ ngayHetHan: HOM_NAY })]).ketQua).toBe("HOP_LE");
  });

  it("TC-06: quét lần 2 trong ngày, giới hạn 1 lượt/ngày → không trừ, đã check-in", () => {
    const luc = new Date("2026-10-08T00:10:00Z");
    const r = run([the({ soLuotTruHomNay: 1, lanCuoiHomNay: luc })]);
    expect(r.ketQua).toBe("DA_CHECKIN");
    expect(r.truLuot).toBe(false);
    expect(r.lanCheckinTruoc).toEqual(luc);
  });

  it("Giới hạn 2 lượt/ngày cho phép lượt thứ 2", () => {
    expect(run([the({ soLuotTruHomNay: 1, toiDaLuotMoiNgay: 2 })]).ketQua).toBe("HOP_LE");
  });

  it("TC-08: 2 thẻ, trừ thẻ hết hạn sớm hơn", () => {
    const r = run([
      the({ id: 2, ngayHetHan: "2026-10-30", ngayMua: "2026-08-01" }),
      the({ id: 1, ngayHetHan: "2026-10-15", ngayMua: "2026-09-01" }),
    ]);
    expect(r.the?.id).toBe(1);
  });

  it("BR-03: cùng hạn thì thẻ mua trước", () => {
    const r = run([
      the({ id: 5, ngayMua: "2026-09-10" }),
      the({ id: 6, ngayMua: "2026-09-02" }),
    ]);
    expect(r.the?.id).toBe(6);
  });

  it("BR-03: bỏ qua thẻ hết lượt để dùng thẻ còn hiệu lực", () => {
    const r = run([the({ id: 1, soLuotConLai: 0, ngayHetHan: "2026-10-10" }), the({ id: 2, ngayHetHan: "2026-12-01" })]);
    expect(r.ketQua).toBe("HOP_LE");
    expect(r.the?.id).toBe(2);
  });

  it("TC-09: thẻ chỉ dùng cơ sở 1, quét ở cơ sở 3 → đỏ sai cơ sở", () => {
    const r = run([the()], 3);
    expect(r.mau).toBe("DO");
    expect(r.lyDo).toBe("SAI_CO_SO");
  });

  it("Thẻ liên cơ sở dùng được ở cơ sở trong danh sách", () => {
    expect(run([the({ dungLienCoSo: true, coSoApDung: [1, 3] })], 3).ketQua).toBe("HOP_LE");
    expect(run([the({ dungLienCoSo: true, coSoApDung: [1, 2] })], 3).lyDo).toBe("SAI_CO_SO");
    expect(run([the({ dungLienCoSo: true, coSoApDung: null })], 3).ketQua).toBe("HOP_LE");
  });

  it("TC-12: khách tự đăng ký chưa duyệt → vàng mời gặp lễ tân", () => {
    const r = run([], 1, "CHO_DUYET");
    expect(r.mau).toBe("VANG");
    expect(r.lyDo).toBe("CHO_DUYET");
    expect(r.ketQua).toBe("BI_CHAN");
  });

  it("TC-13: thẻ chưa cọc, cấu hình đã cọc → vàng", () => {
    const daCoc = datDieuKienThanhToan("DA_COC", { giaThucThu: 500000, daThu: 0, conNo: 500000 });
    expect(daCoc).toBe(false);
    const r = run([the({ daDatThanhToan: daCoc })]);
    expect(r.mau).toBe("VANG");
    expect(r.lyDo).toBe("CHUA_THANH_TOAN");
  });

  it("BR-19: các mức cấu hình thanh toán", () => {
    const don = { giaThucThu: 1000, daThu: 300, conNo: 700 };
    expect(datDieuKienThanhToan("DA_COC", don)).toBe(true);
    expect(datDieuKienThanhToan("DA_THU_DU", don)).toBe(false);
    expect(datDieuKienThanhToan("NGAY_KHI_TAO", { ...don, daThu: 0 })).toBe(true);
    expect(datDieuKienThanhToan("DA_THU_DU", { giaThucThu: 0, daThu: 0, conNo: 0 })).toBe(true);
  });

  it("TC-14 (luật): thẻ trong thời gian bảo lưu → đỏ", () => {
    const r = run([the({ baoLuuTu: "2026-10-01", baoLuuDen: "2026-10-10" })]);
    expect(r.lyDo).toBe("BAO_LUU");
    expect(r.mau).toBe("DO");
    expect(run([the({ baoLuuTu: "2026-09-01", baoLuuDen: "2026-10-07" })]).ketQua).toBe("HOP_LE");
  });

  it("BR-09: hạn tính từ lần check-in đầu → kích hoạt hôm nay", () => {
    const r = run([the({ mocTinhHan: "LAN_DAU_CHECKIN", ngayHetHan: null, hanDungNgay: 30 })]);
    expect(r.kichHoat).toEqual({ ngayKichHoat: HOM_NAY, ngayHetHan: "2026-11-06" });
  });

  it("Thẻ không giới hạn lượt chỉ xét hạn và không trừ", () => {
    const r = run([the({ soLuotGoc: null, soLuotConLai: null })]);
    expect(r.ketQua).toBe("HOP_LE");
    expect(r.truLuot).toBe(false);
  });

  it("BR-12: cảnh báo theo số ngày còn lại", () => {
    const r = run([the({ ngayHetHan: "2026-10-12" })]);
    expect(r.sapHet?.conNgay).toBe(4);
  });

  it("BR-13: đã có thẻ mới còn hiệu lực thì không cảnh báo sắp hết", () => {
    const r = run([the({ id: 1, soLuotConLai: 2, ngayHetHan: "2026-10-20" }), the({ id: 2, ngayHetHan: "2027-01-01" })]);
    expect(r.the?.id).toBe(1);
    expect(r.sapHet).toBeNull();
  });

  it("Thẻ đã huỷ không được xét; không có thẻ → đỏ", () => {
    expect(run([the({ trangThai: "HUY" })]).lyDo).toBe("KHONG_CO_THE");
  });

  it("Đã check-in hôm nay được ưu tiên hơn thẻ cũ bị chặn", () => {
    const r = run([the({ id: 1, ngayHetHan: "2026-10-01" }), the({ id: 2, ngayHetHan: "2026-12-01", soLuotTruHomNay: 1 })]);
    expect(r.ketQua).toBe("DA_CHECKIN");
  });

  it("Trạng thái hiển thị thẻ", () => {
    expect(trangThaiThe(the({ soLuotConLai: 0 }), HOM_NAY)).toBe("HET_LUOT");
    expect(trangThaiThe(the({ ngayHetHan: "2026-10-01" }), HOM_NAY)).toBe("HET_HAN");
    expect(trangThaiThe(the({ mocTinhHan: "LAN_DAU_CHECKIN", ngayHetHan: null }), HOM_NAY)).toBe("CHUA_KICH_HOAT");
  });
});
